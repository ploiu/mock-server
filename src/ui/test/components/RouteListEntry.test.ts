import { fireEvent, render } from '@testing-library/vue';
import RouteListEntry from '../../components/RouteListEntry.vue';
import { UIRoute } from '../../models/index.ts';
import { RequestMethod } from '../../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../../ts/request/RouteTypes.ts';

const baseRoute: UIRoute = {
  id: 'whatever',
  title: 'route title',
  isEnabled: true,
  method: RequestMethod.GET,
  response: '',
  responseStatus: 200,
  routeType: RouteTypes.DEFAULT,
  url: '',
};

describe('header', () => {
  it('should show the route http method', () => {
    const dom = render(RouteListEntry, {
      props: {
        route: baseRoute,
      },
    });
    expect(dom.getByText('GET')).to.exist;
  });

  it('should show the route title', () => {
    const dom = render(RouteListEntry, {
      props: {
        route: baseRoute,
      },
    });
    expect(dom.getByText(/route title/i)).to.exist;
  });
});

describe('delete button', () => {
  it('should show in the card', () => {
    const dom = render(RouteListEntry, {
      props: {
        route: baseRoute,
      },
    });
    expect(dom.getByRole('button', { name: /delete/i })).to.exist;
  });

  test('should emit delete event when clicked', async () => {
    const dom = render(RouteListEntry, {
      props: {
        route: baseRoute,
      },
    });
    expect(dom.emitted().delete).toBeFalsy();
    await fireEvent.click(dom.getByRole('button', { name: /delete/i }));
    expect(dom.emitted().delete.length).toBe(1);
  });
});
