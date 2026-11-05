export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    if (url.hostname !== 'api.bookingmood.com') {
      return new Response('unexpected-outbound', { status: 502 });
    }

    const idFilter = url.searchParams.get('id') ?? '';
    const ids = idFilter.startsWith('in.(') ? idFilter.slice(4, -1).split(',') : [];

    const catalog = [
      { id: '69d91e09-bcf5-4644-bc01-8b9dc0994312', name: { default: 'Black Gum Getaway' } },
      { id: '92acfe1e-aad5-4915-a1a7-93d8f0761676', name: { default: 'Dogwood' } },
      { id: 'd2ffc9ff-723b-4161-bf4c-a03bbf33ba75', name: { default: 'Running Spring Retreat' } },
      { id: '9d314be6-e3f4-4e8e-a0d7-9985a7ebe541', name: { default: 'Black Walnut' } },
      { id: 'c4e61f89-5bf0-46dc-912b-d3faad68588f', name: { default: 'White Oak' } },
      { id: '713c4dea-331c-44ef-85a4-f570666eacef', name: { default: 'Post Oak' } },
    ];

    const rows = catalog.filter((row) => ids.includes(row.id));
    return Response.json(rows, { headers: { 'Content-Type': 'application/json' } });
  },
};
