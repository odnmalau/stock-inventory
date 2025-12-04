import type { Route } from "./+types/login";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { login, createUserSession } from "~/services/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/";

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Form not submitted correctly." };
  }

  const user = await login({ email, password });

  if (!user) {
    return { error: "Email atau password salah." };
  }

  return createUserSession(user.id.toString(), redirectTo as string);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login Stock Inventory</CardTitle>
          <CardDescription className="text-center">
            Masukan email dan password untuk masuk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {actionData?.error && (
              <div className="text-destructive text-sm font-medium">
                {actionData.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sedang Masuk..." : "Masuk"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          Belum punya akun? Hubungi administrator.
        </CardFooter>
      </Card>
    </div>
  );
}
