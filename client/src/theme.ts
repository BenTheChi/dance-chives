import { createTheme, NavLink } from '@mantine/core';

export const theme = createTheme({
  components: {
    NavLink: NavLink.extend({
      styles: {
        root: { padding: 15 },
      },
    }),
  },
});
