import { type Mock, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/vue';
import { RequestMethod } from '../../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../../ts/request/RouteTypes.ts';
import { UIRoute } from '../../models/index.ts';
import { fetchRoutes, saveRoutes } from '../../service/RouteService.ts';
import { within } from '@testing-library/vue';
import RouteView from '../../pages/RouteView.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Lara from '@primeuix/themes/lara';

type FetchRoutesMock = Mock<() => Promise<UIRoute[]>>;
type SaveRoutesMock = Mock<() => Promise<void>>;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

vi.mock('../../service/RouteService', () => ({
  fetchRoutes: vi.fn(),
  saveRoutes: vi.fn(),
}));

const baseRoutes: UIRoute[] = [
  {
    id: '1',
    title: 'first route',
    isEnabled: true,
    method: RequestMethod.POST,
    response: 'whatever',
    responseStatus: 200,
    routeType: RouteTypes.DEFAULT,
    url: '/test',
    responseHeaders: 'content-type: text/plain',
  },
  {
    id: '2',
    title: 'second route',
    isEnabled: false,
    method: RequestMethod.GET,
    response: 'something else',
    responseStatus: 500,
    routeType: RouteTypes.DEFAULT,
    url: '/test',
    responseHeaders: 'content-type: text/plain',
  },
];

const global = {
  plugins: [
    [PrimeVue, { theme: { preset: Lara }, ripple: false }],
    ToastService,
  ],
  // deno-lint-ignore no-explicit-any
} as any;

describe('Route List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('should show the routes', async () => {
    (fetchRoutes as FetchRoutesMock).mockResolvedValue(baseRoutes);
    const dom = render(RouteView, { global });
    await flushPromises();

    for (const route of baseRoutes) {
      expect(dom.getByText(route.title)).to.exist;
    }
  });

  test('should attempt to delete the route when the delete button is clicked', async () => {
    (fetchRoutes as FetchRoutesMock).mockResolvedValue(baseRoutes);
    const dom = render(RouteView, { global });
    await flushPromises();
    const firstCard = within(dom.getByText('first route').closest('.p-card'));
    await fireEvent.click(firstCard.getByRole('button', { name: /delete/i }));
    expect(saveRoutes as SaveRoutesMock).toBeCalledWith(baseRoutes.slice(1));
  });

  test('should attemmpt to enable a disabled route when the toggle is clicked', async () => {
    (fetchRoutes as FetchRoutesMock).mockResolvedValue(baseRoutes);
    const dom = render(RouteView, { global });
    await flushPromises();
    const firstCard = within(dom.getByText('first route').closest('.p-card'));
    await fireEvent.click(firstCard.getByRole('switch', { checked: true }));
    const expected = [
      { ...baseRoutes[0], isEnabled: false },
      ...baseRoutes.slice(1),
    ];
    expect(saveRoutes).toBeCalledWith(expect.arrayContaining(expected));
    expect((saveRoutes as SaveRoutesMock).mock.calls[0][0]).toHaveLength(
      expected.length,
    );
    expect(saveRoutes).toBeCalledTimes(1);
  });

  test('should attempt to disable an enabled route when the toggle is clicked', async () => {
    (fetchRoutes as FetchRoutesMock).mockResolvedValue(baseRoutes);
    const dom = render(RouteView, { global });
    await flushPromises();
    const firstCard = within(dom.getByText('second route').closest('.p-card'));
    await fireEvent.click(firstCard.getByRole('switch', { checked: false }));
    const expected = [
      { ...baseRoutes[1], isEnabled: true },
      baseRoutes[0],
    ];
    expect(saveRoutes).toBeCalledWith(expect.arrayContaining(expected));
    expect((saveRoutes as SaveRoutesMock).mock.calls[0][0]).toHaveLength(
      expected.length,
    );
    expect(saveRoutes).toBeCalledTimes(1);
  });
});

describe('Route Editor', () => {
  test('should show the route edit view when a route is clicked', () => {
    throw 'unimplemented';
  });
});
