import { useState } from 'react';
import { Save, Edit2, Play } from 'lucide-react';

interface SetupData {
  strain?: string;
  medium?: string;
  tent_size?: string;
  quantity?: number;
  nutrient_line?: string;
}

interface GrowSetupCardProps {
  initialData: SetupData;
  onApprove: (data: SetupData) => void;
}

export default function GrowSetupCard({ initialData, onApprove }: GrowSetupCardProps) {
  const [data, setData] = useState<SetupData>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: keyof SetupData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-2xl border border-zinc-800 bg-[#09090b] rounded-none shadow-sm text-zinc-300 font-mono text-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grow Initialization Setup</span>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field 
            label="Strain" 
            value={data.strain || ''} 
            isEditing={isEditing} 
            onChange={(v) => handleChange('strain', v)} 
          />
          <Field 
            label="Plant Quantity" 
            value={data.quantity || 0} 
            type="number"
            isEditing={isEditing} 
            onChange={(v) => handleChange('quantity', Number(v))} 
          />
          <Field 
            label="Grow Medium" 
            value={data.medium || ''} 
            isEditing={isEditing} 
            onChange={(v) => handleChange('medium', v)} 
          />
          <Field 
            label="Tent Size" 
            value={data.tent_size || ''} 
            isEditing={isEditing} 
            onChange={(v) => handleChange('tent_size', v)} 
          />
          <Field 
            label="Nutrient Line" 
            value={data.nutrient_line || ''} 
            isEditing={isEditing} 
            onChange={(v) => handleChange('nutrient_line', v)} 
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => onApprove(data)}
            className="px-4 py-2 text-xs bg-zinc-100 text-zinc-900 font-bold uppercase tracking-wider rounded-none hover:bg-white transition-colors flex items-center gap-2"
          >
            <Play className="h-3.5 w-3.5" />
            Sign Off & Deploy
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ 
  label, 
  value, 
  isEditing, 
  onChange,
  type = "text"
}: { 
  label: string; 
  value: string | number; 
  isEditing: boolean; 
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">
        {label}
      </label>
      {isEditing ? (
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border border-zinc-700 rounded-none px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors focus:ring-0"
        />
      ) : (
        <span className="text-zinc-200 py-1.5 flex items-center h-8">
          {value || '—'}
        </span>
      )}
    </div>
  );
}
