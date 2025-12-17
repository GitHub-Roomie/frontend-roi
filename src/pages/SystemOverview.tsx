import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, TrendingUp, DollarSign, Calculator, ArrowLeft, Bot, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadialChart } from '@/components/RadialChart';
import { setRoiSystem, setRoiDimensions, getCalculationData, hasCalculationData, clearCalculationData, clearRoiSession } from '@/utils/sessionStorage';

const systemConfigs: Record<string, { name: string; dimensions: string[] }> = {
  'order-to-cash': {
    name: 'Agentic Order to Cash',
    dimensions: [
      'Customer Satisfaction',
      'Delivery Time',
      'Net Promoter Score',
      'Human Labor Cost',
      'Revenue Increment',
      'Human Error',
    ],
  },
  'legacy_takeover': {
    name: 'Legacy Takeover',
    dimensions: [
      'Development and Maintenance Efficiency',
      'Software Quality',
      'Delivery Speed',
      'Operational Costs',
      'Satisfaction and Value',
      'Innovation and Scalability',
    ],
  },
  'order_to_cash': {
    name: 'Agentic Order to Cash',
    dimensions: [
      'Savings in Collection Management Costs',
      'Reducing Errors in Billing and Processing',
      'Improved Collection Speed and DSO Reduction',
      'Optimizing Order Processing and Billing',
      'Reduction in Dispute Management and Reconciliation',
      'Improved Customer Experience and Retention',
    ],
  },
  'customer_support': {
    name: 'Agentic Customer Support',
    dimensions: [
      'Cost for Delay in Case Handling',
      'Cost for Case Recurrence',
      'Operational Cost',
      'Cost for Poor Quality',
    ],
  },
  'insights': {
    name: 'Real Time Insights',
    dimensions: [
      'Data Accuracy',
      'Processing Speed',
      'Decision Impact',
      'System Integration',
      'User Adoption',
      'ROI Visibility',
    ],
  },
  'legal_and_compliance': {
    name: 'Legal & Compliance',
    dimensions: [
      'Operational Efficiency',
      'Legal Consulting Cost Reduction',
      'Compliance and Risk Mitigation',
      'Certification and Audit Speed',
      'Talent Productivity and Utilization',
      'Quality, Security and Traceability',
    ],
  },
  'cost_to_hire': {
    name: 'Cost to Hire',
    dimensions: [
      'Savings in Operational Work Costs',
      'Acceleration of Time to Hire',
      'Improvement in Hiring Quality',
      'Savings in External Hiring Costs',
      'Savings from Improved Candidate Experience',
      'Efficiency in Evaluation and Interviews',
    ],
  },
  'compliance': {
    name: 'Contract Management Compliance',
    dimensions: [
      'Compliance Rate',
      'Risk Reduction',
      'Audit Efficiency',
      'Contract Accuracy',
      'Process Speed',
      'Cost Savings',
    ],
  },
  'physical-ai': {
    name: 'Physical AI',
    dimensions: [
      'Automation Level',
      'Safety Score',
      'Efficiency Gain',
      'Downtime Reduction',
      'Quality Improvement',
      'Maintenance Cost',
    ],
  },
  'web-takeover': {
    name: 'Web Interface Takeover',
    dimensions: [
      'Task Completion Rate',
      'Speed Improvement',
      'Error Reduction',
      'User Experience',
      'Integration Complexity',
      'Maintenance Effort',
    ],
  },
  'real_time_insights': {
    name: 'Real Time Insights',
    dimensions: [
      'Operation and Maintenance Cost (O&M)',
      'Labor Costs',
      'Inventory Loss Cost (Shrinkage)',
      'Technology and IT Support Cost',
      'Supply Chain and Logistics Cost',
      'Financial Friction and Insurance Cost',
    ],
  },
};

export default function SystemOverview() {
  const { system } = useParams<{ system: string }>();
  const navigate = useNavigate();
  
  // States for calculation results
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFutureProjection, setShowFutureProjection] = useState(false);
  
  const config = system ? systemConfigs[system] : null;

  useEffect(() => {
    // Check if there are calculation results on load
    if (hasCalculationData()) {
      const results = getCalculationData();
      setCalculationResults(results);
      setShowResults(true);
      console.log('✅ Calculation results loaded:', results);
    }
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">System not found</p>
      </div>
    );
  }

  const handleStart = () => {
    if (system) {
      setRoiSystem(system);
      setRoiDimensions(config.dimensions);
      navigate(`/roi-business-case/${system}/select-agent`);
    }
  };

  const handleNewCase = () => {
    // Clear all cached data including calculation and session data
    clearCalculationData();
    clearRoiSession();
    setCalculationResults(null);
    setShowResults(false);
    
    // Redirect to main ROI page
    navigate('/roi-business-case');
  };

  const handleCalculateProjection = () => {
    setShowFutureProjection(!showFutureProjection);
  };

  // Format numbers for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Render calculation results
  const renderCalculationResults = () => {
    if (!calculationResults || !showResults) return null;

    const { tco_global, dimensions } = calculationResults;

    // Determine which TCO to show (current or future)
    const currentGlobalTco = showFutureProjection ? tco_global.future_tco : tco_global.current_tco;
    
    // Prepare data for radial chart
    const dimensionNames = dimensions.map((dim: any) => dim.dimension_name);
    const dimensionTcoValues = dimensions.map((dim: any) => 
      showFutureProjection ? dim.future_tco : dim.current_tco
    );

    // Calculate maximum absolute value across all dimensions (current and future) for fixed scale
    const allDimensionValues = dimensions.flatMap((dim: any) => [dim.current_tco, dim.future_tco]);
    const maxScaleValue = Math.max(...allDimensionValues);

    // Calculate contribution percentages to global TCO
    const dimensionPercentages = dimensionTcoValues.map((tco: number) => 
      (tco / currentGlobalTco) * 100
    );

    return (
      <div className="space-y-8">
        {/* Total TCO - Centered top */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            {showFutureProjection ? 'The future projection of the process has a' : 'The associated process has a'}
          </p>
          <p className="text-4xl font-bold text-gray-900 mb-2">
            TCO of {formatCurrency(currentGlobalTco)}
          </p>
          <p className="text-gray-600">
            annually{showFutureProjection ? ' projected' : ''}. This process considers the following dimension breakdown:
          </p>
          
          {/* Client Net Savings and AI Investment - Only shown in future projection */}
          {showFutureProjection && tco_global.ahorro_neto_cliente_total && (
            <div className="mt-6 p-6 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Net Savings Column */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    Your Net Savings with AI Implementation
                  </p>
                  <p className="text-4xl md:text-5xl font-extrabold text-emerald-600">
                    {formatCurrency(tco_global.ahorro_neto_cliente_total)}
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-2">
                    annually projected
                  </p>
                </div>
                
                {/* AI Investment Column */}
                {tco_global.fee_servicio_total && (
                  <div className="text-center border-l-0 md:border-l-2 border-emerald-200 pl-0 md:pl-6">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      AI Investment
                    </p>
                    <p className="text-4xl md:text-5xl font-extrabold text-emerald-600">
                      {formatCurrency(tco_global.fee_servicio_total)}
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-2">
                      annually projected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radial Chart */}
          <div className="flex items-center justify-center">
            <div className="w-full aspect-square max-w-md">
              <RadialChart 
                dimensions={dimensionNames} 
                data={dimensionTcoValues}
                maxValue={maxScaleValue}
                customColors={{
                  grid: "#d1d5db",
                  axis: "#1f2937",
                  axisLabel: "#6b7280",
                  radarStroke: "#10b981",
                  radarFill: "#10b981"
                }}
              />
            </div>
          </div>

          {/* Dimension Legend */}
          <div className="flex flex-col justify-center space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dimension Legend</h3>
            <div className="space-y-3">
              {dimensionNames.map((name: string, index: number) => {
                const dimension = dimensions.find((d: any) => d.dimension_name === name);
                const tcoValue = showFutureProjection ? dimension?.future_tco : dimension?.current_tco;
                const percentage = (tcoValue / currentGlobalTco) * 100;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm leading-tight">{name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        CO: <span className="font-semibold text-emerald-600">{formatCurrency(tcoValue || 0)}</span>
                        {' '}({formatPercentage(percentage)})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggle Projection Button */}
        <div className="flex justify-center pt-4">
          <Button onClick={handleCalculateProjection} size="lg" className="px-8">
            <Calculator className="h-5 w-5 mr-2" />
            {showFutureProjection ? 'View Current Projection' : 'View Future Projection'}
          </Button>
        </div>
      </div>
    );
  };

  // Render initial view (no results)
  const renderInitialView = () => {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="rounded-2xl text-card-foreground shadow-sm border-0 secondary-card bg-bluegrey-100 p-6">
            <div className="w-full aspect-square max-w-md">
              <RadialChart dimensions={config.dimensions} />
            </div>
          </div>
          <div className="rounded-2xl text-card-foreground shadow-sm border-0 secondary-card bg-bluegrey-100 p-6 flex flex-col">
            <div className='flex-grow'>
              <div className="font-bold text-2xl text-gray-900">
                <span>{config.name.split(' ').slice(1).join(' ')}</span>
              </div>

              <p className="text-gray-700 text-sm mt-1">
                The process associated with the Agentic {config.name.split(' ').slice(1).join(' ')} module has {config.dimensions.length} dimensions:
              </p>

              <ul className="text-gray-700 text-sm mt-4 space-y-1">
                {config.dimensions.map((dimension) => (
                  <li key={dimension} className="flex items-center">
                    <Check className="text-bluegrey-700 mr-2" />
                    {dimension}</li>
                ))}
              </ul>

              <p className="text-gray-700 text-sm mt-4">
                These dimensions may vary depending on the information completed in the questionnaire, let's begin...
              </p>
            </div>
            <Button onClick={handleStart} size="lg" className="px-8">
              Start Use Case
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
        </div>
      </>
    );
  };

  return (
    <div className="w-full h-full main-card bg-white rounded-2xl  py-8 px-4 mb-4">
      {/* Header */}
      <div className="flex items-center">
        <div className="bg-bluegrey-200 rounded-2xl size-10 flex items-center justify-center mr-3">
          <Bot className="size-6 text-bluegrey-700" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ROI First Assistant</h1>
        </div>

        {/* "New Use Case" button only if there are results */}
        {showResults && (
          <Button variant="outline" onClick={handleNewCase}>
            New Use Case
          </Button>
        )}
      </div>
      <div className="flex items-center cursor-pointer font-bold text-lg mt-8" onClick={() => navigate(-1)}>
        <ArrowLeft /> <span className='ml-3'>{config.name}</span>
      </div>
      {/* Contenido principal */}
      <div className="mt-8">
        {showResults ? renderCalculationResults() : renderInitialView()}
      </div>
    </div>
  );
}