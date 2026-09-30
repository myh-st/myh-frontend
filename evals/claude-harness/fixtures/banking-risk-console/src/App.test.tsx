import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('shows the alert queue and filters by severity', async () => {
  render(
    <MemoryRouter initialEntries={['/alerts']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('alert-row')).toHaveLength(13);
  await userEvent.selectOptions(screen.getByTestId('severity-filter'), 'critical');
  await vi.waitFor(() => expect(screen.getAllByTestId('alert-row')).toHaveLength(4));
});
