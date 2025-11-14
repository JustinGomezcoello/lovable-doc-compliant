import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Phone, CreditCard, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AnalysisTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: customerData, refetch } = useQuery({
    queryKey: ["customer-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;

      // Search in POINT_Competencia
      const { data, error } = await supabase
        .from("POINT_Competencia")
        .select("*")
        .or(`Cedula.eq.${searchTerm},Celular.eq.${searchTerm},idCompra.eq.${searchTerm}`)
        .limit(1)
        .single();

      if (error || !data) return null;

      // Get conversation history if conversation_id exists
      let conversations = null;
      if (data.conversation_id) {
        const { data: chatData } = await supabase
          .from("n8n_chat_histories")
          .select("*")
          .eq("session_id", data.conversation_id.toString())
          .order("created_at", { ascending: true });
        
        conversations = chatData;
      }

      return { customer: data, conversations };
    },
    enabled: false
  });

  const handleSearch = () => {
    setSearching(true);
    refetch().finally(() => setSearching(false));
  };

  const parseMessage = (msg: any) => {
    try {
      if (msg.type === "human") {
        return msg.content;
      } else if (msg.type === "ai") {
        const parsed = JSON.parse(msg.content);
        return parsed.output || msg.content;
      }
      return msg.content;
    } catch {
      return msg.content;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Análisis de Cliente</h2>
        <p className="text-muted-foreground">Busca por cédula, celular o ID de compra</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Ingresa cédula, celular o idCompra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching || !searchTerm}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {customerData?.customer && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">Cliente:</span>
                  <span>{customerData.customer.Cliente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">Cédula:</span>
                  <span>{customerData.customer.Cedula}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">Celular:</span>
                  <span>{customerData.customer.Celular}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Saldo Vencido:</span>
                  <Badge variant="destructive">${customerData.customer.SaldoVencido}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Días Mora:</span>
                  <Badge variant="outline">{customerData.customer.DiasMora}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Comprobante Enviado:</span>
                  <Badge variant={customerData.customer.ComprobanteEnviado === "SI" ? "default" : "secondary"} 
                    className={customerData.customer.ComprobanteEnviado === "SI" ? "bg-success text-success-foreground" : ""}>
                    {customerData.customer.ComprobanteEnviado || "NO"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {customerData.conversations && customerData.conversations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Historial de Conversación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {customerData.conversations.map((msg: any, idx: number) => {
                      const isHuman = msg.message.type === "human";
                      return (
                        <div
                          key={idx}
                          className={`flex ${isHuman ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              isHuman
                                ? "bg-muted text-foreground"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <div className="text-xs mb-1 opacity-70">
                              {isHuman ? "Cliente" : "Bot"}
                            </div>
                            <div className="text-sm">{parseMessage(msg.message)}</div>
                            <div className="text-xs mt-2 opacity-70">
                              {new Date(msg.created_at).toLocaleString("es-EC")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AnalysisTab;
