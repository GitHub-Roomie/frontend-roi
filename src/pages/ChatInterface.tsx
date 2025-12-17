import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Send, Sparkles, Bot, AlertCircle, Calculator, Download, ArrowLeft, Zap, Trash, Paperclip, SendHorizonal, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getRoiSystem, getRoiType, getRoiDimensions } from '@/utils/sessionStorage';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  conversation_history: any[];
  success: boolean;
  current_state?: any;
  conversation_id?: string;
  data?: any;
  missing_or_invalid_fields?: any[];
  ready_for_calculation?: boolean;
  validation_report?: any;
  status?: string;
  timestamp?: string;
}

interface CorrectionState {
  awaiting_corrections: boolean;
  valid_data: any;
  invalid_fields: any[];
  status: string;
}

interface ROICalculationResult {
  success: boolean;
  system: string;
  summary_text: string;
  calculation_details?: string;
  tco_global: {
    current_tco: number;
    future_tco: number;
    roi_total: number;
    roi_percentage: number;
    payback_months?: number;
  };
  dimensions: Array<{
    dimension_id: string;
    dimension_name: string;
    current_tco: number;
    future_tco: number;
    roi: number;
    ia_improvement_factor: number;
    impacto_ia: number;
    impact_percentage: number;
    description?: string;
  }>;
  metadata?: any;
}

export default function ChatInterface() {
  const { system } = useParams<{ system: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States for agents
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [correctionState, setCorrectionState] = useState<CorrectionState | null>(null);
  const [currentState, setCurrentState] = useState<any>(null);

  // States for ROI calculation
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCalculateButton, setShowCalculateButton] = useState(false);
  const [collectedData, setCollectedData] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const roiSystem = getRoiSystem();
  const roiType = getRoiType();
  const dimensions = getRoiDimensions();

  // System name mapping
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

  const displayName = system ? (systemNames[system] || system) : '';

  useEffect(() => {
    if (!roiSystem || !roiType || !system) {
      toast.error('Session data missing. Please start from the beginning.');
      navigate('/roi-business-case');
    } else {
      // Send initial "Hello" message automatically
      sendInitialGreeting();
    }
  }, [roiSystem, roiType, system, navigate]);

  // Function to send the initial greeting without showing it in the chat
  const sendInitialGreeting = async () => {
    try {
      // Clear history before sending "Hello"
      setConversationHistory([]);
      setConversationId(null);
      setCurrentState(null);
      
      setIsLoading(true);
      // Explicitly pass empty values to ensure they are sent
      const response = await sendMessageToAPI('Hello', {
        conversationHistory: [],
        conversationId: null,
        currentState: null
      });
      
      // Only add the assistant's response, not the "Hello"
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || 'Welcome to the ROI analysis.',
      };
      
      setMessages([assistantMessage]);
    } catch (error) {
      console.error('Error sending initial greeting:', error);
      toast.error('Error starting the conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (!chatContainer) return;

    const handleScroll = () => {
      setShowScrollTop(chatContainer.scrollTop > 200);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const agentName = roiType === 'expert' ? 'GPT ROI First' : 'ROI First Assistant';
  const AgentIcon = roiType === 'expert' ? Sparkles : Bot;

  const sendMessageToAPI = async (messageText: string, overrideState?: { conversationHistory?: any[], conversationId?: string | null, currentState?: any | null }) => {
    try {
      const historyToUse = overrideState?.conversationHistory !== undefined ? overrideState.conversationHistory : conversationHistory;
      const conversationIdToUse = overrideState?.conversationId !== undefined ? overrideState.conversationId : conversationId;
      const currentStateToUse = overrideState?.currentState !== undefined ? overrideState.currentState : currentState;
      
      let requestPayload: any = {
        message: messageText,
        system: roiSystem || 'legacy_takeover',
        conversation_history: historyToUse,
        user_type: roiType === 'expert' ? 'expert' : 'beginner',
        current_state: currentStateToUse,
        conversation_id: conversationIdToUse
      };

      if (correctionState?.awaiting_corrections) {
        requestPayload.correction_context = {
          is_correction: true,
          valid_data: correctionState.valid_data,
          correcting_fields: correctionState.invalid_fields.map(
            (field: any) => field.field || field.field_description
          )
        };
        
        console.log('🔄 Sending correction with context:', requestPayload.correction_context);
      }

      const response = await fetch('https://web.portal.roi-roomie.com:449/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.conversation_history) {
        setConversationHistory(data.conversation_history);
      }

      if (data.current_state || data.conversation_id) {
        setCurrentState(data.current_state);
        setConversationId(data.conversation_id);
      }

      // Detect if data collection is complete
      if (data.status === 'completed' || data.status === 'data_completed' || data.status === 'validated_complete') {
        console.log('✅ Complete data detected');
        
        let dataToSave = null;
        
        if (roiType === 'beginner' && data.current_state?.collected_data) {
          // Guided agent
          dataToSave = data.current_state.collected_data;
          console.log('📊 Guided agent data:', dataToSave);
        } else if (roiType === 'expert' && data.data) {
          // Expert agent
          dataToSave = data.data;
          console.log('📊 Expert agent data:', dataToSave);
        }
        
        if (dataToSave) {
          setCollectedData(dataToSave);
          setShowCalculateButton(true);
          
          // Save to sessionStorage immediately
          sessionStorage.setItem('collectedData', JSON.stringify(dataToSave));
          console.log('💾 Data saved to sessionStorage');
          
          toast.success('All data collected! Ready to calculate ROI.');
        }
      }

      // Handle expert correction state
      if (data.status === 'awaiting_corrections' && data.missing_or_invalid_fields) {
        setCorrectionState({
          awaiting_corrections: true,
          valid_data: data.data || {},
          invalid_fields: data.missing_or_invalid_fields || [],
          status: data.status
        });
        console.log('❌ Errors detected:', data.missing_or_invalid_fields);
      } else if (data.status === 'validated_complete' || data.ready_for_calculation) {
        setCorrectionState(null);
        console.log('✅ Validation complete');
      } else if (data.status === 'awaiting_missing_data' && data.missing_or_invalid_fields) {
        setCorrectionState({
          awaiting_corrections: true,
          valid_data: data.data || {},
          invalid_fields: data.missing_or_invalid_fields || [],
          status: data.status
        });
        console.log('⚠️ Missing data');
      }

      return data;
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !roiSystem || !roiType) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAPI(message);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || 'Thank you for your message. I will help you with the ROI analysis.',
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Function to calculate ROI
  const handleCalculateROI = async () => {
    if (!collectedData || !roiSystem) {
      toast.error('No data available for calculation');
      return;
    }

    setIsCalculating(true);
    
    try {
      console.log('🧮 Starting ROI calculation...');
      console.log('📊 Data to send:', collectedData);

      const response = await fetch('https://web.portal.roi-roomie.com:449/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: roiSystem,
          collected_data: collectedData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const calculationResult: ROICalculationResult = await response.json();

      if (!calculationResult.success) {
        throw new Error(calculationResult.metadata?.error || 'Calculation failed');
      }

      console.log('✅ Calculation completed:', calculationResult);

      // Save results to sessionStorage
      sessionStorage.setItem('calculationData', JSON.stringify(calculationResult));
      console.log('💾 Results saved to sessionStorage');

      // Show success toast
      toast.success('ROI calculation completed successfully!');

      // Redirect to overview screen
      setTimeout(() => {
        navigate(`/roi-business-case/${system}/overview`);
      }, 500);

    } catch (error) {
      console.error('❌ Error calculating ROI:', error);
      toast.error('Failed to calculate ROI. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setConversationId(null);
    setCorrectionState(null);
    setCurrentState(null);
    setShowCalculateButton(false);
    setCollectedData(null);
    
    // Clear only the chat, NOT the results
    sessionStorage.removeItem('collectedData');
    
    toast.success('Chat cleared');
    
    // Send initial "Hello" message automatically after clearing
    setTimeout(() => {
      sendInitialGreeting();
    }, 500);
  };

  // Render correction indicator
  const renderCorrectionIndicator = () => {
    if (!correctionState?.awaiting_corrections) return null;

    return (
      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-orange-800 dark:text-orange-400 font-medium">
            Correction Mode:
          </span>
          <span className="text-orange-700 dark:text-orange-300">
            {correctionState.invalid_fields.length} field(s) pending
          </span>
        </div>
      </div>
    );
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
        <ArrowLeft /> <span className='ml-3'>{displayName}</span>
      </div>
      <div className="flex items-center justify-between">    
        <div className="flex items-center gap-2">
          {roiType === 'expert' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Determine which template to download based on the system
                let templateFile = '';
                let templateName = '';
                
                if (roiSystem === 'customer_support') {
                  templateFile = '/Plantilla_Customer_Support.txt';
                  templateName = 'template_customer_support.txt';
                } else if (roiSystem === 'order_to_cash') {
                  templateFile = '/Plantilla_Order_To_Cash.txt';
                  templateName = 'template_order_to_cash.txt';
                } else if (roiSystem === 'legacy_takeover') {
                  templateFile = '/Plantilla_Legacy_TakeOver.txt';
                  templateName = 'template_legacy_takeover.txt';
                } else if (roiSystem === 'cost_to_hire') {
                  templateFile = '/Plantilla_Cost_To_Hire.txt';
                  templateName = 'template_cost_to_hire.txt';
                } else if (roiSystem === 'legal_and_compliance') {
                  templateFile = '/Plantilla_Legal_And_Compliance.txt';
                  templateName = 'template_legal_and_compliance.txt';
                } else if (roiSystem === 'real_time_insights') {
                  templateFile = '/Plantilla_Real_Time_Insights.txt';
                  templateName = 'template_real_time_insights.txt';
                } else if (roiSystem === 'customer_support_automation') {
                  templateFile = '/Plantilla_Customer_Support_Automation.txt';
                  templateName = 'template_customer_support_automation.txt';
                } else {
                  // Default template
                  templateFile = '/Plantilla_Legacy_TakeOver.txt';
                  templateName = 'template_legacy_takeover.txt';
                }
                
                const link = document.createElement('a');
                link.href = templateFile;
                link.download = templateName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          )}
          
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              Clear Chat
            </Button>
          )}
        </div>
      </div>
      <div className='flex space-x-2 mt-8 itmes-start'>
        <div className=' md:w-1/3 secondary-card bg-bluegrey-100 text-gray-900 p-6 rounded-2xl'>
          <div className='text-2xl font-bold'>Smart suggestions</div>
          <div className='text-sm font-normal'>Choose an AI suggestion.</div>
          <div className='mt-6'>
            <div className='flex gap-3 items-center bg-bluegrey-300 px-3 py-4 rounded-2xl'>
              <div className='bg-bluegrey-200 size-12 flex items-center justify-center rounded-2xl'>
                <Zap className='size-6 text-bluegrey-700' />
              </div>
              <div className='font-medium text-sm text-gray-900'>
                Estimate the current TCO of the process
              </div>
            </div>
          </div>
        </div>  
        <div className="flex flex-col flex-grow md:w-2/3 rounded-xl p-6 h-[calc(100%-8rem)] secondary-card bg-bluegrey-100 relative">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold text-foreground">ROI First Assistant</h2>
            <Button variant='outline' className='font-jetbrains border-bluegrey-700 rounded-xl'> 
              Delete Chat
              <Trash className="size-5 ml-2" />
            </Button>
          </div>

          {/* Correction indicator */}
          {renderCorrectionIndicator()}

          {/* Calculate ROI Button - Appears when data is complete */}
          {showCalculateButton && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-400">
                      Data collection completed!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      All required data has been collected and validated
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Determine which template to download based on the system
                      let templateFile = '';
                      let templateName = '';
                      
                      if (roiSystem === 'customer_support') {
                        templateFile = '/Plantilla_Customer_Support.txt';
                        templateName = 'template_customer_support.txt';
                      } else if (roiSystem === 'order_to_cash') {
                        templateFile = '/Plantilla_Order_To_Cash.txt';
                        templateName = 'template_order_to_cash.txt';
                      } else if (roiSystem === 'legacy_takeover') {
                        templateFile = '/Plantilla_Legacy_TakeOver.txt';
                        templateName = 'template_legacy_takeover.txt';
                      } else if (roiSystem === 'cost_to_hire') {
                        templateFile = '/Plantilla_Cost_To_Hire.txt';
                        templateName = 'template_cost_to_hire.txt';
                      } else if (roiSystem === 'legal_and_compliance') {
                        templateFile = '/Plantilla_Legal_And_Compliance.txt';
                        templateName = 'template_legal_and_compliance.txt';
                      } else {
                        // Default template
                        templateFile = '/Plantilla_Legacy_TakeOver.txt';
                        templateName = 'template_legacy_takeover.txt';
                      }
                      
                      const link = document.createElement('a');
                      link.href = templateFile;
                      link.download = templateName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="border-green-600 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    onClick={handleCalculateROI}
                    disabled={isCalculating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate ROI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <div className="w-full h-[350px] p-6 bg-bluegrey-300 rounded-xl text-gray-900 items-center justify-center flex flex-col">
              <div className='bg-bluegrey-200 size-12 flex items-center justify-center rounded-2xl'>
                <Zap className='size-6 text-bluegrey-700' />
              </div>
              <div className="text-center py-4">
                <p className="text-xl font-semibold mb-2">Tell me about the current process</p>
                <p className="text-sm">Share details about your process to start the ROI analysis</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 chat-messages-container">
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl p-4 whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-xl p-4">
                  <div className="flex gap-2">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-2">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="size-11 bg-bluegrey-200 text-bluegrey-700 rounded-full mr-3"
              >
                <Paperclip className="size-5" />
              </Button>
              <div className="flex-grow relative">
                <Input

                  placeholder={
                    correctionState?.awaiting_corrections
                      ? 'Send only the corrected value...'
                      : 'write the general description of the process'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="h-12 bg-bluegrey-200 text-gray-800 flex-1 rounded-full pl-10 pr-12 focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading || isCalculating}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-green-600  hover:bg-green-500 flex items-center justify-center"
                >
                  <SendHorizonal className="size-4 text-gray-900" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-bluegrey-800 font-jetbrains font-bold mt-2">
              Valid formats: PDF, TXT (max. 10MB)
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Status info */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {conversationHistory.length > 0 && `Messages: ${conversationHistory.length}`}
              </span>
              
              {correctionState?.awaiting_corrections && (
                <span className="text-orange-600 font-medium">
                  Correcting {correctionState.invalid_fields.length} field(s)
                </span>
              )}
              
              {showCalculateButton && !isCalculating && (
                <span className="text-green-600 font-medium">
                  ✓ Ready to calculate
                </span>
              )}
              
              {conversationId && (
                <span>ID: {conversationId}</span>
              )}
            </div>
          </div>

          {/* Floating Scroll to Top Button */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              size="icon"
              className="absolute bottom-20 right-6 size-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg z-50 transition-all duration-300"
              title="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}