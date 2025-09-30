import { Header } from "./Header";
import { Navigation } from "./Navigation";

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-6 bg-[#fbfbfc]">{children}</main>
      </div>
    </div>
  );
}
