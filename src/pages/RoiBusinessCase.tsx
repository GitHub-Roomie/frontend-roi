import { Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import OrderToCash from "@/components/icons/OrderToCash";
import AgenticCustomerITSupport from "@/components/icons/AgenticCustomerITSupport";
import LegalCompliance from "@/components/icons/LegalCompliance";
import AgenticRecruitingHiringIcon from "@/components/icons/AgenticRecruitingHiringIcon";
import LegacySystemsTakeoverIcon from "@/components/icons/LegacySystemsTakeoverIcon";
import RealTimeInsightsIcon from "@/components/icons/RealTimeInsightsIcon";

const modules = [
  {
    title: "Order to Cash",
    subtitle: "Order to Cash",
    icon: OrderToCash,
    description: "Streamline O2C",
    route: "order_to_cash"
  },
  {
    title: "Customer Support",
    subtitle: "Customer Support",
    icon: AgenticCustomerITSupport,
    description: "AI-powered support",
    route: "customer_support"
  },
  {
    title: "Customer Support Automation",
    subtitle: "Customer Support Automation",
    icon: AgenticCustomerITSupport,
    description: "Automate support operations",
    route: "customer_support_automation"
  },
  {
    title: "Legal & Compliance",
    subtitle: "Legal & Compliance",
    icon: LegalCompliance,
    description: "Automated compliance",
    route: "legal_and_compliance"
  },
  {
    title: "Cost to Hire",
    subtitle: "Cost to Hire",
    icon: AgenticRecruitingHiringIcon,
    description: "Optimize hiring costs",
    route: "cost_to_hire"
  },
  {
    title: "Legacy Takeover",
    subtitle: "Legacy Takeover",
    icon: LegacySystemsTakeoverIcon,
    description: "Modernize legacy systems",
    route: "legacy_takeover"
  },
  {
    title: "Real Time Insights",
    subtitle: "Real Time Insights",
    icon: RealTimeInsightsIcon,
    description: "Real-time business insights",
    route: "real_time_insights"
  }
];

export default function RoiBusinessCase() {
  const navigate = useNavigate();

  const handleModuleClick = (route: string) => {
    navigate(`/roi-business-case/${route}/overview`);
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ROI Business Case
        </h1>
        <p className="text-bluegrey-900 text-sm md:text-base mt-2">
          Create a new ROI business case.
        </p>
      </div>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="bg-bluegrey-200 rounded-2xl size-10 flex items-center justify-center mt-8">
          <Bot className="size-6 text-bluegrey-700" />
        </div>
        <h2 className="text-2xl mt-4 text-gray-900 font-bold">ROI First Assistant</h2>
        <div className="text-base text-center">
          Select one of the agentic AI modules to create a new business case
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card 
              key={module.title}
              onClick={() => handleModuleClick(module.route)}
              className="rounded-2xl text-card-foreground shadow-sm border-0 secondary-card bg-bluegrey-100 px-6 py-8 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center">
                  <div className="bg-bluegrey-200 rounded-2xl size-14 flex items-center justify-center mb-4">
                    <Icon className="size-10 text-bluegrey-700 group-hover:text-accent transition-colors" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold text-foreground leading-tight mt-6">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-bluegrey-900 text-sm font-normal">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </>
  );
}
