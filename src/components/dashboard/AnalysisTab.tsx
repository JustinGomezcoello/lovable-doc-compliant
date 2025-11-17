import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Phone, CreditCard, MessageCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const AnalysisTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: customerData, refetch, isLoading } = useQuery({
    queryKey: ["customer-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;

      // Search in POINT_Competencia
      const { data, error } = await supabase
        .from("POINT_Competencia")
        .select("*")
        .or(`Cedula.eq.${searchTerm},Celular.eq.${searchTerm},idCompra.eq.${searchTerm}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error searching customer:", error);
        return null;
      }

      if (!data) return null;

      // Get conversation history if conversation_id exists
      let conversations = null;
      if (data.conversation_id && data.conversation_id > 0) {
        const { data: chatData, error: chatError } = await supabase
          .from("n8n_chat_histories")
          .select("*")
          .eq("session_id", data.conversation_id.toString())
          .order("created_at", { ascending: true });
        
        if (chatError) {
          console.error("Error fetching chat history:", chatError);
        } else {
          conversations = chatData;
        }
      }

      return { customer: data, conversations };
    },
    enabled: false
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    refetch().finally(() => setSearching(false));
  };

  const parseMessage = (msg: any) => {
    try {
      if (msg.type === "human") {
        // For human messages, content is directly the text
        return msg.content;
      } else if (msg.type === "ai") {
        // For AI messages, content is a JSON string with an "output" field
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
        <p className="text-muted-foreground">Busca por cédula, celular o ID de compra para ver el historial de conversaciones</p>
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
            <Button onClick={handleSearch} disabled={searching || !searchTerm.trim()}>
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {customerData?.customer && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">ID Compra:</span>
                  <span>{customerData.customer.idCompra}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Artículo:</span>
                  <span>{customerData.customer.Articulo}</span>
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
                  <Badge 
                    variant={customerData.customer.ComprobanteEnviado === "SI" ? "default" : "secondary"}
                    className={customerData.customer.ComprobanteEnviado === "SI" ? "bg-success text-success-foreground" : ""}
                  >
                    {customerData.customer.ComprobanteEnviado === "SI" ? "✓ Enviado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Conversation ID:</span>
                  <span className="text-xs text-muted-foreground">{customerData.customer.conversation_id || "Sin conversación"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {customerData.conversations && customerData.conversations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Historial de Conversación WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {customerData.conversations.map((msg: any, idx: number) => {
                      const isHuman = msg.message.type === "human";
                      const messageContent = parseMessage(msg.message);
                      
                      return (
                        <div
                          key={idx}
                          className={`flex ${isHuman ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-4 shadow-sm ${
                              isHuman
                                ? "bg-muted text-foreground rounded-tl-none"
                                : "bg-primary text-primary-foreground rounded-tr-none"
                            }`}
                          >
                            <div className="text-xs font-semibold mb-1 opacity-80">
                              {isHuman ? customerData.customer.Cliente : "Bot Cobranza"}
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {messageContent}
                            </div>
                            <div className="text-xs mt-2 opacity-70">
                              {new Date(msg.created_at).toLocaleString("es-EC", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : customerData.customer.conversation_id && customerData.customer.conversation_id > 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron mensajes en el historial de conversación</p>
                <p className="text-sm mt-2">Conversation ID: {customerData.customer.conversation_id}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Este cliente no tiene conversaciones registradas</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isLoading && !customerData && searchTerm && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontró ningún cliente con el criterio de búsqueda</p>
            <p className="text-sm mt-2">Intenta con otra cédula, celular o ID de compra</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisTab;
