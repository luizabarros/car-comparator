import Head from 'next/head';
import { Toaster } from './components/Toaster';
import ComparisonPage from './components/ComparisonPage';

export default function Home() {
  return (
    <>
      <Head>
        <title>Comparador de Carros FIPE | Compare Preços e Especificações</title>
        <meta
          name="description"
          content="Compare preços e especificações de carros usando a tabela FIPE. Escolha marca, modelo e ano para fazer comparações lado a lado."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ComparisonPage />
        <Toaster />
      </div>
    </>
  );
}
