import React from 'react';
import { useParams } from 'react-router-dom';
import { eleves, Eleve } from '../../Data/eleves';

const ProfilEleve: React.FC = () => {
  const { id } = useParams();
  const eleve = eleves.find((e: Eleve) => e.id === Number(id));

  if (!eleve) return <p>Élève non trouvé</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{eleve.nom}</h1>
      <p>Niveau : {eleve.niveau}</p>
      <p>Moyenne : {eleve.moyenne}</p>
      <p>Exercices complétés : 0</p>
      <p>Leçons suivies : 0</p>
    </div>
  );
};

export default ProfilEleve;
