import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequestStep2Form } from './NewRequestStep2Form';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('NewRequestStep2Form renders Diagnóstico IA section', () => {
  render(
    <NewRequestStep2Form
      title="Fuga de agua"
      techDescription="Desc"
      price={50}
      aiRange={{ min: 40, max: 80 }}
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
      onPriceChange={vi.fn()}
      onDesiredExecutionTimeChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Diagnóstico IA')).toBeInTheDocument();
  expect(screen.getByText(/Revisa los datos/)).toBeInTheDocument();
  expect(screen.getByText('40€ - 80€')).toBeInTheDocument();
  expect(screen.getByText(/Dificultad estimada/i)).toBeInTheDocument();
});

test('NewRequestStep2Form shows schedule options', () => {
  render(
    <NewRequestStep2Form
      title=""
      techDescription=""
      price={undefined}
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
      onPriceChange={vi.fn()}
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
      price={50}
      aiRange={{ min: 40, max: 80 }}
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
      onPriceChange={vi.fn()}
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
      price={undefined}
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
      onPriceChange={vi.fn()}
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
