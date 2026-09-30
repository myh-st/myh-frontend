import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('lists new hires and filters by cohort', async () => {
  render(
    <MemoryRouter initialEntries={['/hires']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('hire-row')).toHaveLength(10);
  await screen.findByRole('option', { name: 'October 2026 – Wave A' });
  await userEvent.selectOptions(screen.getByTestId('cohort-filter'), 'c-2026-10a');
  await vi.waitFor(() => expect(screen.getAllByTestId('hire-row')).toHaveLength(3));
});
