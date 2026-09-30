import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('shows conversations, messages and the actions awaiting approval', async () => {
  render(
    <MemoryRouter initialEntries={['/c/c-102']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('conversation-item')).toHaveLength(8);
  expect(await screen.findAllByTestId('message')).toHaveLength(3);
  expect(await screen.findByTestId('proposed-actions')).toHaveTextContent('INTEG');
});
