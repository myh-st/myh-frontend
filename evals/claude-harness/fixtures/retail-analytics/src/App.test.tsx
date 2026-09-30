import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { installBackend } from './mock/framework';
import { routes, resetMockData } from './mock/routes';
import App from './App';

beforeAll(() => installBackend(routes, { latencyMs: 0 }));
beforeEach(() => resetMockData());

it('shows totals, region breakdown and anomalies for the selected dates', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(await screen.findAllByTestId('metric-box')).toHaveLength(4);
  expect(await screen.findAllByTestId('region-row')).toHaveLength(4);
  expect(await screen.findAllByTestId('anomaly-item')).toHaveLength(8);
  fireEvent.change(screen.getByTestId('from-date'), { target: { value: '2026-09-01' } });
  await vi.waitFor(() => expect(screen.getAllByTestId('anomaly-item')).toHaveLength(4));
});
