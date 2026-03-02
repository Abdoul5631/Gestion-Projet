import React from 'react';
import ProgressBar from './ProgressBar';

interface LessonCardProps {
  title: string;
  subject: string;
  level: string;
  progress: number;
}

const LessonCard: React.FC<LessonCardProps> = ({
  title,
  subject,
  level,
  progress,
}) => {
  return (
    <div className="rounded-sm border bg-white p-5 shadow-default">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-1 text-sm text-gray-500">
        {subject} • {level}
      </p>

      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>

      <button className="mt-4 w-full rounded bg-primary py-2 text-white">
        {progress > 0 ? 'Continuer' : 'Commencer'}
      </button>
    </div>
  );
};

export default LessonCard;

