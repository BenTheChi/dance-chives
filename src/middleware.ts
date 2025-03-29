export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/member/",
    // '+' mean one or more parameter anything come after edit  will include this route in middleware function
    "/series/:id+",
  ],
};
