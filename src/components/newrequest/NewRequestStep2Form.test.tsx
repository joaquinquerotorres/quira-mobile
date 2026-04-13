import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequestStep2Form } from './NewRequestStep2Form';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('NewRequestStep2Form muestra el texto original del cliente cuando viene informado', () => {
  render(
    <NewRequestStep2Form
      title="Fuga"
      techDescription="Desc IA"
      clientOriginalDescription="  Mi grifo gotea desde ayer  "
      category="PLUMBING"
      onCategoryChange={vi.fn()}
      aiRange={{ min: 4000, max: 8000 }}
      riskLevel="LOW"
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={[]}
      clarifyingAnswers={[]}
      onClarifyingAnswerChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
    { wrapper },
  );
  expect(screen.getByText('Tu texto original')).toBeInTheDocument();
  expect(screen.getByText('Mi grifo gotea desde ayer')).toBeInTheDocument();
});

test('NewRequestStep2Form renders Diagnóstico IA section', () => {
  render(
    <NewRequestStep2Form
      title="Fuga de agua"
      techDescription="Desc"
      category="PLUMBING"
      onCategoryChange={vi.fn()}
      aiRange={{ min: 4000, max: 8000 }}
      riskLevel="HIGH"
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={[]}
      clarifyingAnswers={[]}
      onClarifyingAnswerChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Diagnóstico IA')).toBeInTheDocument();
  expect(screen.getByText(/Revisa los datos/)).toBeInTheDocument();
  expect(screen.getByText('Categoría')).toBeInTheDocument();
  expect(screen.getByText('Rango estimado en tu zona (IA)')).toBeInTheDocument();
  expect(screen.getByText('40€ - 80€')).toBeInTheDocument();
  expect(screen.getByText(/Dificultad estimada/i)).toBeInTheDocument();
});

test('NewRequestStep2Form shows schedule options', () => {
  render(
    <NewRequestStep2Form
      title=""
      techDescription=""
      category="DIY"
      onCategoryChange={vi.fn()}
      aiRange={null}
      riskLevel={undefined}
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={[]}
      clarifyingAnswers={[]}
      onClarifyingAnswerChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('¿Cuándo lo necesitas?')).toBeInTheDocument();
  expect(screen.getByText('PUBLICAR SOLICITUD')).toBeInTheDocument();
});

test('NewRequestStep2Form calls onSubmit when button clicked', () => {
  const onSubmit = vi.fn();
  render(
    <NewRequestStep2Form
      title=""
      techDescription=""
      category="DIY"
      onCategoryChange={vi.fn()}
      aiRange={{ min: 4000, max: 8000 }}
      riskLevel={undefined}
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={[]}
      clarifyingAnswers={[]}
      onClarifyingAnswerChange={vi.fn()}
      onSubmit={onSubmit}
    />,
    { wrapper }
  );
  fireEvent.click(screen.getByText('PUBLICAR SOLICITUD'));
  expect(onSubmit).toHaveBeenCalled();
});

test('NewRequestStep2Form shows optional media section with helper text', () => {
  render(
    <NewRequestStep2Form
      title=""
      techDescription=""
      category="DIY"
      onCategoryChange={vi.fn()}
      aiRange={null}
      riskLevel={undefined}
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={[]}
      clarifyingAnswers={[]}
      onClarifyingAnswerChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Añadir más detalles (opcional)')).toBeInTheDocument();
  expect(screen.getByText(/Cuanto más detallada sea tu solicitud/)).toBeInTheDocument();
  expect(screen.getByText('Foto')).toBeInTheDocument();
  expect(screen.getByText('Vídeo')).toBeInTheDocument();
  expect(screen.getByText('Audio')).toBeInTheDocument();
});

test('NewRequestStep2Form renders clarifying questions and updates answers', () => {
  const onClarifyingAnswerChange = vi.fn();
  render(
    <NewRequestStep2Form
      title=""
      techDescription=""
      category="DIY"
      onCategoryChange={vi.fn()}
      aiRange={{ min: 1000, max: 2000 }}
      riskLevel={undefined}
      desiredExecutionTime="Lo antes posible"
      photoBase64={null}
      audioBase64={null}
      videoBase64={null}
      extraMedia={[]}
      maxExtraMedia={3}
      onAddExtraMedia={vi.fn()}
      onRemoveExtraMedia={vi.fn()}
      onTitleChange={vi.fn()}
      onTechDescriptionChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      clarifyingQuestions={['¿De cuántos m² hablamos?']}
      clarifyingAnswers={['']}
      onClarifyingAnswerChange={onClarifyingAnswerChange}
      onSubmit={vi.fn()}
    />,
    { wrapper }
  );

  expect(screen.getByText('Preguntas de la IA (obligatorias)')).toBeInTheDocument();
  const input = screen.getByPlaceholderText('Escribe tu respuesta...');
  fireEvent(input, new CustomEvent('ionInput', { detail: { value: '20 m²' } }));
  expect(onClarifyingAnswerChange).toHaveBeenCalledWith(0, '20 m²');
});
