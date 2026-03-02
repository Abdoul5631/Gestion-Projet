interface ProgressBarProps {
    value: number; // 0 - 100
  }
  
  const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
    return (
      <div className="w-full">
        <div className="mb-1 flex justify-between text-sm font-medium">
          <span>Progression</span>
          <span>{value}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };
  
  export default ProgressBar;
  