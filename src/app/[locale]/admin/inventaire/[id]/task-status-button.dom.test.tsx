import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  updateTaskStatusAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { TaskStatusButton } from './task-status-button';

describe('TaskStatusButton', () => {
  it("TODO → affiche '○'", () => {
    render(<TaskStatusButton taskId="t1" status="TODO" />);
    expect(screen.getByRole('button').textContent).toBe('○');
  });

  it("DONE → affiche '✓'", () => {
    render(<TaskStatusButton taskId="t1" status="DONE" />);
    expect(screen.getByRole('button').textContent).toBe('✓');
  });

  it("SKIPPED → affiche '−'", () => {
    render(<TaskStatusButton taskId="t1" status="SKIPPED" />);
    expect(screen.getByRole('button').textContent).toBe('−');
  });

  it("clic sur TODO → appelle updateTaskStatusAction avec DONE", async () => {
    const { updateTaskStatusAction } = await import('../actions');
    const mock = vi.mocked(updateTaskStatusAction);
    mock.mockResolvedValue({});

    render(<TaskStatusButton taskId="task42" status="TODO" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('task42', 'DONE');
    });
  });

  it("clic sur DONE → appelle updateTaskStatusAction avec SKIPPED", async () => {
    const { updateTaskStatusAction } = await import('../actions');
    const mock = vi.mocked(updateTaskStatusAction);
    mock.mockResolvedValue({});

    render(<TaskStatusButton taskId="t1" status="DONE" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('t1', 'SKIPPED');
    });
  });

  it("clic sur SKIPPED → appelle updateTaskStatusAction avec TODO", async () => {
    const { updateTaskStatusAction } = await import('../actions');
    const mock = vi.mocked(updateTaskStatusAction);
    mock.mockResolvedValue({});

    render(<TaskStatusButton taskId="t1" status="SKIPPED" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('t1', 'TODO');
    });
  });

  it("erreur action → toast", async () => {
    const { updateTaskStatusAction } = await import('../actions');
    vi.mocked(updateTaskStatusAction).mockResolvedValue({ error: 'Sous-tâche introuvable' });

    const { toast } = await import('@/lib/utils/toast');

    render(<TaskStatusButton taskId="t1" status="TODO" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Sous-tâche introuvable', 'error');
    });
  });

  it("bouton a un title décrivant le statut", () => {
    render(<TaskStatusButton taskId="t1" status="TODO" />);
    expect(screen.getByRole('button').getAttribute('title')).toContain('TODO');
  });
});
