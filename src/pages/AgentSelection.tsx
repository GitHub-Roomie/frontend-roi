import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Bot, Sparkles, ArrowLeft, Zap } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { setRoiType, setCompanyInfo } from '@/utils/sessionStorage';
import { useState } from 'react';

export default function AgentSelection() {
  const { system } = useParams<{ system: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<'beginner' | 'expert' | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [primarySector, setPrimarySector] = useState('');
  const [secondarySectors, setSecondarySectors] = useState<string[]>([]);

  const systemNames: Record<string, string> = {
    'order_to_cash': 'Agentic Order to Cash',
    'customer_support': 'Agentic Customer Support',
    'legacy_takeover': 'Legacy Takeover',
    'legal_and_compliance': 'Legal & Compliance',
    'cost_to_hire': 'Cost to Hire',
    'compliance': 'Contract Management Compliance',
    'real_time_insights': 'Real Time Insights',
    'customer_support_automation': 'Customer Support Automation',
    'physical-ai': 'Physical AI',
    'web-takeover': 'Web Interface Takeover',
  };

  const displayName = system ? systemNames[system] || system : '';

  const sectors = [
    { value: 'tecnologia', label: 'Technology' },
    { value: 'finanzas', label: 'Finance' },
    { value: 'salud', label: 'Health' },
    { value: 'manufactura', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'servicios', label: 'Services' },
    { value: 'educacion', label: 'Education' },
    { value: 'otro', label: 'Other' },
  ];

  const availableSecondarySectors = sectors.filter(s => s.value !== primarySector);

  const handleSecondarySectoToggle = (sectorValue: string) => {
    setSecondarySectors(prev => {
      if (prev.includes(sectorValue)) {
        return prev.filter(s => s !== sectorValue);
      } else if (prev.length < 2) {
        return [...prev, sectorValue];
      }
      return prev;
    });
  };

  const handleAgentSelect = (type: 'beginner' | 'expert') => {
    setSelectedAgent(type);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!companyName || !companySize || !primarySector) {
      return;
    }

    setCompanyInfo({
      name: companyName,
      size: companySize,
      sector: primarySector,
      secondarySectors: secondarySectors,
    });

    if (selectedAgent) {
      setRoiType(selectedAgent);
      navigate(`/roi-business-case/${system}/chat`);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex items-center">
        <div className="bg-bluegrey-200 rounded-2xl size-10 flex items-center justify-center mr-3">
          <Bot className="size-6 text-bluegrey-700" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ROI First Assistant</h1>
        </div>
      </div>
      <div className="flex items-center cursor-pointer font-bold text-lg mt-8" onClick={() => navigate(-1)}>
        <ArrowLeft /> <span className='ml-3'> {displayName} </span>
      </div>

        <h3 className="text-2xl font-bold text-gray-900 mt-8">
          How do you want to start?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Card
            onClick={() => handleAgentSelect('beginner')}
            className="secondary-card bg-bluegrey-100 px-6 py-8 border-0 cursor-pointer hover:bg-bluegrey-300 transition-colors"
          >
            <CardHeader className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-bluegrey-200 rounded-2xl size-14 flex items-center justify-center mr-3">
                  <Bot className="size-10 text-bluegrey-700" strokeWidth={1.5} />
                </div>
              </div>
              <h4 className="text-2xl font-semibold text-foreground">ROI First Assistant</h4>
            </CardHeader>
          </Card>

          <Card
            onClick={() => handleAgentSelect('expert')}
            className="secondary-card bg-bluegrey-100 px-6 py-8 border-0 cursor-pointer hover:bg-bluegrey-300 transition-colors"
          >
            <CardHeader className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-bluegrey-200 rounded-2xl size-14 flex items-center justify-center mr-3">
                  <Zap className="size-10 text-bluegrey-700" strokeWidth={1.5} />
                </div>
              </div>
              <h4 className="text-2xl font-semibold text-foreground">GPT ROI First</h4>
            </CardHeader>
          </Card>
        </div>


      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-bluegrey-100">
          <DialogHeader>
            <DialogTitle>Company Information</DialogTitle>
            <DialogDescription className='text-sm text-gray-900'>
              Please complete the following information before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                className="bg-bluegrey-200 placeholder:text-bluegrey-800 text-bluegrey-900 rounded-full"
                placeholder="Enter the company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size">Size</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger id="company-size"
                className="bg-bluegrey-200 placeholder:text-bluegrey-800 text-bluegrey-900 rounded-full">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">More than 1000 employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-sector">Primary Sector</Label>
              <Select value={primarySector} onValueChange={setPrimarySector}>
                <SelectTrigger id="company-sector" 
                className="bg-bluegrey-200 placeholder:text-bluegrey-800 text-bluegrey-900 rounded-full">
                  <SelectValue placeholder="Select primary sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {primarySector && (
              <div className="space-y-2">
                <Label>Secondary Sectors (optional, max 2)</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
                  {availableSecondarySectors.map(sector => (
                    <div key={sector.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`secondary-${sector.value}`}
                        checked={secondarySectors.includes(sector.value)}
                        onCheckedChange={() => handleSecondarySectoToggle(sector.value)}
                        disabled={!secondarySectors.includes(sector.value) && secondarySectors.length >= 2}
                      />
                      <label
                        htmlFor={`secondary-${sector.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {sector.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 font-jetbrains">
            <Button variant="outline" size="sm"
              className='h-8 border-gray-500 text-gray-900 text-sm py-1 px-4'
            
             onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              size='sm'
              className='h-8 bg-green-500 text-gray-900 text-sm py-1 px-4'
              disabled={!companyName || !companySize || !primarySector}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
