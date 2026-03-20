import type { QuizSettings, QuizQuestion } from '../types/quiz';

export async function generateQuizQuestions(
  settings: QuizSettings
): Promise<QuizQuestion[]> {
  const { topic, category, difficulty, questionCount, apiKey } = settings;

  const topicText = topic.trim()
    ? `on the topic of "${topic}" within the ${category} category`
    : `in the ${category} category`;

  const difficultyDescriptions = {
    easy: 'beginner-friendly, straightforward',
    medium: 'intermediate level, requiring some knowledge',
    hard: 'expert level, challenging and nuanced',
  };

  const prompt = `Generate exactly ${questionCount} multiple-choice quiz questions ${topicText}.
Difficulty: ${difficulty} (${difficultyDescriptions[difficulty]})

Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.

Format:
[
  {
    "id": 1,
    "question": "Clear, engaging question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why the correct answer is right AND why the wrong answers are incorrect. Be specific about common misconceptions.",
    "hint": "A subtle clue that points toward the answer without revealing it directly.",
    "subtopic": "Specific subtopic name within ${category} (e.g., 'Machine Learning', 'Photosynthesis', 'World War II', etc.)"
  }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer is the 0-based index (0, 1, 2, or 3) of the correct option
- Questions must be factually accurate and appropriate for ${difficulty} difficulty
- Make questions engaging and thought-provoking
- Vary the position of the correct answer across questions
- Keep options concise but clear
- explanation MUST explain why wrong options are wrong, not just why the correct one is right
- hint should be helpful but not give away the answer directly
- subtopic must be a specific sub-category name (2-4 words max)`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional quiz creator and educator. You generate accurate, engaging multiple-choice questions with detailed explanations that help learners understand WHY wrong answers are wrong. Return ONLY valid JSON arrays with no additional text or formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_completion_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as any)?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Groq API error: ${errorMsg}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from Groq API');
  }

  const cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();

  let questions: QuizQuestion[];
  try {
    questions = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      questions = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse quiz questions from API response');
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid quiz questions format returned');
  }

  return questions.map((q, i) => ({
    id: q.id ?? i + 1,
    question: q.question ?? '',
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
    explanation: q.explanation ?? '',
    hint: q.hint ?? 'Think carefully about all the options before choosing.',
    subtopic: q.subtopic ?? category,
  }));
}

export async function fetchLearningResources(
  apiKey: string,
  weakSubtopics: string[],
  category: string
): Promise<{ subtopic: string; explanation: string; resources: { title: string; url: string; type: string }[] }[]> {
  const prompt = `For a student who is weak in these subtopics within ${category}: ${weakSubtopics.join(', ')}

Return a JSON array with learning recommendations for each subtopic.

Format:
[
  {
    "subtopic": "subtopic name",
    "explanation": "2-3 sentence explanation of why this topic is important and what the student should focus on",
    "resources": [
      { "title": "Resource Name", "url": "https://actual-url.com", "type": "article|video|course|documentation" }
    ]
  }
]

Rules:
- Provide 3-4 real, currently available learning resources per subtopic
- Use real URLs from Khan Academy, MDN, Coursera, YouTube, Wikipedia, freeCodeCamp, W3Schools, MIT OpenCourseWare, etc.
- Resources must be freely accessible
- Return ONLY valid JSON, no extra text`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert educator who recommends high-quality, real learning resources. Return ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_completion_tokens: 3000,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  try {
    const match = cleaned.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}
