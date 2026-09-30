import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('lists connections and adds an API-key connection', async () => {
  render(
    <MemoryRouter initialEntries={['/connectors']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('connection-row')).toHaveLength(11);
  await vi.waitFor(() => expect(screen.getByTestId('connector-type-select')).toHaveTextContent('REST API'));
  await userEvent.selectOptions(screen.getByTestId('connector-type-select'), 'rest_api');
  await userEvent.type(screen.getByTestId('add-name'), 'Status page API');
  await userEvent.type(screen.getByTestId('add-scopes'), 'http.get');
  await userEvent.type(screen.getByTestId('add-endpoint'), 'https://status.acme.com/api/v2');
  await userEvent.type(screen.getByTestId('cred-headerName'), 'Authorization');
  await userEvent.type(screen.getByTestId('cred-apiKey'), 'sk_live_123');
  await userEvent.click(screen.getByRole('button', { name: 'Add' }));
  await vi.waitFor(() => expect(screen.getAllByTestId('connection-row')).toHaveLength(12));
});
