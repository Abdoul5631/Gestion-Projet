import React from 'react';
import { Link } from 'react-router-dom';
import { eleves } from '../../data/eleves';

const ListeEleves: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Liste des élèves</h1>
      <ul className="space-y-2">
        {eleves.map((eleve) => (
          <li key={eleve.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between items-center">
            <span>{eleve.nom} - {eleve.niveau} - Moyenne : {eleve.moyenne}</span>
            <Link
              to={`/eleve/${eleve.id}`}
              className="text-blue-500 hover:underline"
            >
              Voir profil
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListeEleves;
