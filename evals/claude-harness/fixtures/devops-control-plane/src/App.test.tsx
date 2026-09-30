import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('lists incidents and filters by status', async () => {
  render(
    <MemoryRouter initialEntries={['/incidents']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('incident-row')).toHaveLength(9);
  await userEvent.selectOptions(screen.getByTestId('status-filter'), 'resolved');
  await vi.waitFor(() => expect(screen.getAllByTestId('incident-row')).toHaveLength(2));
});
