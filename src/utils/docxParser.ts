import mammoth from 'mammoth';
import { Question } from '../types';

export async function parseDocxQuestions(file: File, olympiadId: string): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || '';

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: Question[] = [];
  let currentQuestion: {
    content: string;
    points: number;
    options: { key: string; text: string; isCorrect: boolean }[];
    correctAnswer?: string;
  } | null = null;

  
  const questionHeaderRegex = /^(?:(\d+)[\.\)]|Savol\s*\d+:?)\s*(.*)/i;
  
  const optionRegex = /^([A-Z])[\.\)]\s*(.*)/i;
  
  const correctAnswerLineRegex = /^(?:To['’`]?g['’`]?ri\s+javob|Javob|Answer):\s*([A-Z])/i;
  
  const pointsRegex = /(?:\[|\()?\s*([\d\.,]+)\s*(?:ball|ballari|balli|point|points|pts)\s*(?:\]|\))?/i;

  function parsePointsFromText(text: string): { cleanText: string; points?: number } {
    const pMatch = text.match(pointsRegex);
    if (pMatch) {
      const parsedVal = parseFloat(pMatch[1].replace(',', '.'));
      if (!isNaN(parsedVal) && parsedVal > 0) {
        const clean = text.replace(pMatch[0], '').trim();
        return { cleanText: clean, points: parsedVal };
      }
    }
    return { cleanText: text };
  }

  function finalizeCurrentQuestion() {
    if (!currentQuestion) return;
    if (!currentQuestion.content) return;

    let correctAns = currentQuestion.correctAnswer;
    const optionsTextList: string[] = [];

    currentQuestion.options.forEach((opt) => {
      optionsTextList.push(opt.text);
      if (opt.isCorrect) {
        correctAns = opt.key;
      }
    });

    
    if (!correctAns && currentQuestion.options.length > 0) {
      correctAns = currentQuestion.options[0].key;
    }

    questions.push({
      id: `q-docx-${Date.now()}-${questions.length + 1}`,
      olympiadId,
      roundId: 'r1',
      type: currentQuestion.options.length > 0 ? 'multiple_choice' : 'open_text',
      content: currentQuestion.content.trim(),
      points: currentQuestion.points !== undefined ? currentQuestion.points : 10,
      order: questions.length + 1,
      options: currentQuestion.options.length > 0 ? optionsTextList : undefined,
      correctAnswer: correctAns
    });

    currentQuestion = null;
  }

  for (const line of lines) {
    const qMatch = line.match(questionHeaderRegex);
    const optMatch = line.match(optionRegex);
    const correctLineMatch = line.match(correctAnswerLineRegex);

    if (correctLineMatch && currentQuestion) {
      currentQuestion.correctAnswer = correctLineMatch[1].toUpperCase();
      continue;
    }

    if (optMatch && currentQuestion) {
      const optionKey = optMatch[1].toUpperCase();
      let optionVal = optMatch[2].trim();
      let isCorrect = false;

      if (optionVal.endsWith('*')) {
        isCorrect = true;
        optionVal = optionVal.slice(0, -1).trim();
      }

      currentQuestion.options.push({
        key: optionKey,
        text: optionVal,
        isCorrect
      });
      continue;
    }

    if (qMatch) {
      
      finalizeCurrentQuestion();

      const rawQText = line.replace(/^(?:\d+[\.\)]|Savol\s*\d+:?)\s*/i, '').trim();
      const { cleanText, points } = parsePointsFromText(rawQText);

      currentQuestion = {
        content: cleanText,
        points: points !== undefined ? points : 10,
        options: []
      };
      continue;
    }

    
    if (currentQuestion) {
      if (currentQuestion.options.length > 0) {
        const lastOpt = currentQuestion.options[currentQuestion.options.length - 1];
        lastOpt.text += ' ' + line;
      } else {
        const { cleanText, points } = parsePointsFromText(line);
        if (points !== undefined) {
          currentQuestion.points = points;
        }
        currentQuestion.content += ' ' + cleanText;
      }
    }
  }

  
  finalizeCurrentQuestion();

  return questions;
}
