import "./globals.css";

// Revalidate hourly so a transient Firestore failure during build can't
// permanently bake an empty Popular section into the static page
export const revalidate = 3600;
import Hero from "./components/Hero";
import Services from "./components/Services";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Security from "./components/Security";
import Popular from "./components/Popular";

export default function Home() {
  return (
    <main>
      <Hero />
      <Popular />
      <Services />
      <Security />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}
