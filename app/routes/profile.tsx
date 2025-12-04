import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { useLoaderData } from "react-router";
import { getUser, requireUserId } from "~/services/auth.server";
import { User, Mail, Shield } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  await requireUserId(request);
  const user = await getUser(request);
  return { user };
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{user?.nama ?? 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email ?? 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user?.role ?? 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
