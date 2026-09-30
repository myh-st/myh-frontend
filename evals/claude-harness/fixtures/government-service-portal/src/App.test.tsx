import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('shows the case list and filters to my cases', async () => {
  render(
    <MemoryRouter initialEntries={['/cases']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('case-row')).toHaveLength(12);
  await userEvent.selectOptions(screen.getByTestId('assignee-filter'), 'me');
  await vi.waitFor(() => expect(screen.getAllByTestId('case-row')).toHaveLength(7));
});
