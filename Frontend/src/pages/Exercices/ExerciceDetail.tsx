import { useParams } from 'react-router-dom';

const ExerciceDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        📝 Exercice #{id}
      </h1>

      <p className="text-gray-600">
        Contenu de l’exercice à venir.
      </p>
    </div>
  );
};

export default ExerciceDetail;
