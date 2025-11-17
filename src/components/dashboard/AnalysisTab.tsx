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
        <h2 className="text-2xl font-bold mb-2">Conversaciones de WhatsApp</h2>
        <p className="text-muted-foreground">Busca por cédula, celular o ID de compra para ver el historial de conversaciones del cliente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Ingresa cédula, celular o ID de compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
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

      {!isLoading && customerData?.customer && (
        <>
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{customerData.customer.Cliente || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cédula</p>
                    <p className="font-semibold">{customerData.customer.Cedula || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Celular</p>
                    <p className="font-semibold">{customerData.customer.Celular || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Artículo</p>
                    <p className="font-semibold">{customerData.customer.Articulo || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">ID de Compra</p>
                    <p className="font-semibold">{customerData.customer.idCompra || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estado de Comprobante</p>
                    {customerData.customer.ComprobanteEnviado === "SI" ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Comprobante Enviado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Historial de Conversación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!customerData.conversations || customerData.conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No hay conversaciones disponibles
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este cliente no tiene historial de conversaciones registrado
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {customerData.conversations.map((msg: any, idx: number) => {
                      const messageText = parseMessage(msg.message);
                      const isHuman = msg.message.type === "human";
                      const timestamp = new Date(msg.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex ${isHuman ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              isHuman
                                ? 'bg-muted text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={isHuman ? "secondary" : "default"} className="text-xs">
                                {isHuman ? "Cliente" : "Bot"}
                              </Badge>
                              <span className="text-xs opacity-70">{timestamp}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {messageText}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && !customerData && searchTerm && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No se encontraron resultados
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta buscar con otra cédula, celular o ID de compra
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisTab;
