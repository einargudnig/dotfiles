const order = (o: Record<string, unknown>) => ({
  LocationName: 'Skrifstofan',
  MealTime: 'Lunch',
  OrderItemStatus: 'Default',
  CompensationStatus: 'NoCompensation',
  WebsiteUrl: null,
  ...o,
})

export const W41 = JSON.stringify({
  count: 3,
  isoWeek: '2026-W41',
  orders: [
    order({
      Date: '2026-10-07',
      RestaurantName: 'Arctic Pies',
      BlogUrl: 'https://www.maul.is/veitingastadir/arctic-pies',
      ShortDescriptionByLang: { en: 'Beef and Cheese Pie', is: 'Nautahakksbaka' },
      DescriptionByLang: { en: 'Beef mince pie.', is: 'Nautahakk með lauk og cheddarosti.' },
      Allergens: ['gluten', 'eggs', 'fish'],
      HasFeedback: false,
    }),
    order({
      Date: '2026-10-06',
      RestaurantName: 'Eldhúsið okkar',
      BlogUrl: 'https://www.maul.is/veitingastadir/eldhusidokkar',
      ShortDescriptionByLang: { en: 'Kentucky-style breaded cod', is: 'Þorskur í kentucky raspi' },
      DescriptionByLang: { en: 'Cod.', is: 'Þorskur.' },
      Allergens: ['fish'],
      HasFeedback: true,
    }),
    order({
      Date: '2026-10-09',
      RestaurantName: 'Fylgifiskar',
      BlogUrl: null,
      ShortDescriptionByLang: { is: 'Pistasíulanga' },
      DescriptionByLang: { is: 'Langa.' },
      Allergens: [],
      HasFeedback: false,
    }),
  ],
})

export const EMPTY_WEEK = JSON.stringify({ count: 0, orders: [] })
