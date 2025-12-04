import { auth } from "@/lib/auth";
import { ORPCError, os } from "@orpc/server";

export const baseProcedure = os;

export const protectedProcedure = baseProcedure
  .$context<{ headers: Headers }>()
  .use(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });
    if (!session) {
      throw new ORPCError("UNAUTHORIZED", { message: "Unauthorized" });
    }
    return next({ context: { ...context, session } });
  });
