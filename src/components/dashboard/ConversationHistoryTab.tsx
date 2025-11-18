import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Phone, CreditCard, MessageCircle, Package, Bot, AlertCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingState from "@/components/ui/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationRecord {
  idCompra: number;
  Cliente: string;
  Cedula: number;
  Celular: number;
  conversation_id: number;
  Segmento?: string;
  Status?: string;
  Articulo?: string;
  ComprobanteEnviado?: string;
}

interface ConversationMessage {
  id: number;
  conversation_id: number;
  fecha_iso: string;
  rol: "BOT" | "CLIENTE" | "DESCONOCIDO" | string;
  privado: boolean;
  estado: string;
  tipo: string;
  texto: string;
}

interface ConversationHistory {
  conversation_id: number;
  total: number;
  transcript?: string;
  mensajes: ConversationMessage[];
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_CONVERSATION_WEBHOOK_URL || 
  "https://primary-production-f05b.up.railway.app/webhook/651db7d0-7d3e-42a8-82b0-133c08a78201";

const ConversationHistoryTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [comprobanteFilter, setComprobanteFilter] = useState<"todos" | "enviado" | "no_enviado">("todos");
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);

  // Consulta para obtener todos los registros con conversation_id válido
  const { data: allRecords, isLoading: isLoadingAll } = useQuery({
    queryKey: ["conversation-records-v3"], // Cambiar key para forzar refetch
    queryFn: async () => {
      console.log("🔍 Obteniendo TODOS los registros con conversaciones...");
      
      // Obtener TODOS los registros usando paginación manual
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMoreData = true;
      
      while (hasMoreData) {
        console.log(`📖 Obteniendo página ${page + 1}...`);
        
        const { data, error } = await supabase
          .from("POINT_Competencia")
          .select(`
            idCompra,
            Cliente,
            Cedula,
            Celular,
            conversation_id,
            Segmento,
            Status,
            Articulo,
            ComprobanteEnviado
          `)
          .not("conversation_id", "is", null)
          .neq("conversation_id", 0)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order("Cliente", { ascending: true });

        if (error) {
          console.error("❌ Error obteniendo registros:", error);
          break;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`✅ Página ${page + 1}: ${data.length} registros obtenidos`);
          console.log(`📈 Total acumulado: ${allData.length} registros`);
          
          // Si obtuvimos menos registros que el pageSize, es la última página
          if (data.length < pageSize) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else {
          hasMoreData = false;
        }
      }

      console.log(`🎯 TOTAL FINAL obtenido: ${allData.length} registros`);
      console.log(`✅ Esperados: 1155 registros con conversation_id válido`);
      
      return allData as ConversationRecord[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener el detalle del cliente seleccionado y su conversación
  const { data: customerData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["customer-conversation-detail", selectedRecord?.idCompra],
    queryFn: async () => {
      if (!selectedRecord) return null;

      console.log("🔍 Loading conversation detail for record:", selectedRecord.idCompra);

      try {
        console.log(`📞 Llamando webhook n8n para conversation_id: ${selectedRecord.conversation_id}`);
        
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: selectedRecord.conversation_id
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Respuesta del webhook:", data);

        // El webhook puede devolver un array o un objeto
        const historyData = Array.isArray(data) ? data[0] : data;
        
        if (!historyData || !historyData.mensajes) {
          throw new Error("Formato de respuesta inválido del webhook");
        }

        // Ordenar mensajes por fecha
        const mensajesOrdenados = historyData.mensajes.sort((a: ConversationMessage, b: ConversationMessage) => 
          new Date(a.fecha_iso).getTime() - new Date(b.fecha_iso).getTime()
        );

        return {
          customer: selectedRecord,
          conversations: {
            ...historyData,
            mensajes: mensajesOrdenados
          }
        };

      } catch (error) {
        console.error("❌ Error obteniendo historial:", error);
        throw error;
      }
    },
    enabled: !!selectedRecord
  });
  // Filtrar registros según el término de búsqueda y filtro de comprobante
  const filteredRecords = allRecords?.filter(record => {
    // Filtro de búsqueda por texto
    const searchMatches = !searchTerm.trim() || (() => {
      const search = searchTerm.toLowerCase();
      return (
        record.Cliente?.toLowerCase().includes(search) ||
        record.Cedula?.toString().includes(search) ||
        record.Celular?.toString().includes(search) ||
        record.idCompra?.toString().includes(search) ||
        record.conversation_id?.toString().includes(search)
      );
    })();
    
    // Filtro de comprobante enviado
    const comprobanteMatches = (() => {
      switch (comprobanteFilter) {
        case "enviado":
          return record.ComprobanteEnviado === "SI";
        case "no_enviado":
          return record.ComprobanteEnviado !== "SI";
        case "todos":
        default:
          return true;
      }
    })();
    
    return searchMatches && comprobanteMatches;
  });// Función para formatear texto con markdown (convertir **texto** y *texto* a <strong>texto</strong>)
  const formatMarkdownText = (text: string) => {
    // Primero convertir **texto** a <strong>texto</strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Luego convertir *texto* a <strong>texto</strong> (pero evitar conflictos con texto ya formateado)
    formattedText = formattedText.replace(/\*([^*<>]+?)\*/g, function(match, p1) {
      // Verificar que no esté dentro de un tag <strong> existente
      return '<strong>' + p1 + '</strong>';
    });
    
    return formattedText;
  };
  // Función para parsear mensajes
  const parseMessage = (message: ConversationMessage) => {
    const messageText = message.texto?.trim() || "";
    
    // Filtrar mensajes de estado del sistema - PARA CUALQUIER ROL
    if (messageText) {
      // Patrones más específicos para capturar TODOS los mensajes del sistema
      const estadosSistemaPatterns = [
        // Patrones en español
        /\b\w+\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)/i,
        /\b\w+\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)\s+/i,
        /^(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó)/i,
        
        // Patrones en inglés (común en sistemas)
        /\b\w+\s+(added|removed|deleted|updated|modified|changed)/i,
        /\b\w+\s+(added|removed|deleted|updated|modified|changed)\s+/i,
        /^(added|removed|deleted|updated|modified|changed)/i,
        
        // Patrones específicos de Chatwoot/Paolo
        /^Paolo\s+(agregó|añadió|eliminó|quitó|modificó|cambió|actualizó|added|removed|deleted|updated)/i,
        /Paolo\s+(added|removed|deleted|updated|modified|changed)/i,
        
        // Patrones para campos específicos como "comprobante_enviado"
        /\w+\s+(added|removed)\s+\w+/i,
        /\w+\s+(agregó|eliminó)\s+\w+/i,
        
        // Errores del sistema
        /\[ERROR\s+EXTERNO\]/i,
        /\(#\d+\)/,
        
        // Patrones para mensajes vacíos o de sistema
        /^null$/i,
        /^undefined$/i,
        /^\s*$/,
        
        // Patrones para acciones de etiquetas/labels
        /\w+\s+(added|removed|applied|deleted)\s+(label|tag|etiqueta)/i,
        /\w+\s+(agregó|eliminó|aplicó)\s+(etiqueta|label)/i
      ];
      
      const isStateMessage = estadosSistemaPatterns.some(pattern => pattern.test(messageText));
      if (isStateMessage) {
        console.log("🚫 Mensaje del sistema filtrado:", messageText, "- Rol:", message.rol);
        return null; // No mostrar estos mensajes
      }
    }
      if (!messageText) {
      return message.rol === "BOT" ? "<strong>PLANTILLA PERSONALIZADA WHATSAPP</strong>" : "<strong>IMAGEN ENVIADA</strong>";
    }
    
    // Cambiar [Sin contenido] por IMAGEN ENVIADA en negrita
    if (messageText === "[Sin contenido]") {
      return "<strong>IMAGEN ENVIADA</strong>";
    }
    
    // Formatear texto con markdown
    return formatMarkdownText(messageText);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Conversaciones de WhatsApp</h2>
        <p className="text-muted-foreground">Busca por cédula, celular, nombre o ID de compra para ver el historial de conversaciones del cliente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cliente
          </CardTitle>
        </CardHeader>        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Busca por nombre, cédula, celular o ID de compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px]"
            />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={comprobanteFilter} onValueChange={(value: "todos" | "enviado" | "no_enviado") => setComprobanteFilter(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por comprobante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  <SelectItem value="enviado">Comprobante enviado</SelectItem>
                  <SelectItem value="no_enviado">Sin comprobante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingAll ? (
        <LoadingState 
          title="Cargando clientes..."
          message="Buscando todos los clientes con conversaciones activas en el sistema."
          skeletonCount={4}
        />
      ) : (
        <>
          {/* Lista de clientes */}
          {filteredRecords && filteredRecords.length > 0 && !selectedRecord && (
            <Card>              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Clientes con Conversaciones ({filteredRecords.length})</span>
                  {allRecords && (
                    <div className="flex gap-2 text-sm">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Total: {allRecords.length}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Con comprobante: {allRecords.filter(r => r.ComprobanteEnviado === "SI").length}
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        Sin comprobante: {allRecords.filter(r => r.ComprobanteEnviado !== "SI").length}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredRecords.map((record) => (
                      <div
                        key={record.idCompra}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-semibold">{record.Cliente}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Cédula: {record.Cedula}</p>
                              <p>Celular: {record.Celular}</p>
                              <p>ID Compra: {record.idCompra}</p>
                              <p>Conversation ID: {record.conversation_id}</p>
                            </div>
                          </div>
                          {record.ComprobanteEnviado === "SI" && (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              Comprobante Enviado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Detalle del cliente seleccionado */}
          {selectedRecord && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedRecord(null)}
                className="mb-4"
              >
                ← Volver a la lista
              </Button>

              {isLoadingDetail ? (
                <LoadingState 
                  title="Cargando detalles del cliente..."
                  message="Obteniendo información completa y historial de conversaciones."
                  skeletonCount={3}
                />
              ) : customerData?.customer ? (
                <>
                  {/* Customer Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Información del Cliente
                      </CardTitle>
                    </CardHeader>                    <CardContent>
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
                      {!customerData.conversations || customerData.conversations.mensajes.length === 0 ? (
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
                          <div className="space-y-3 py-2">                            {customerData.conversations.mensajes.map((msg: ConversationMessage, idx: number) => {
                              const messageText = parseMessage(msg);
                              const isBot = msg.rol === "BOT";
                              const timestamp = new Date(msg.fecha_iso).toLocaleString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });

                              // Filtrar mensajes nulos (estados del bot) y mensajes vacíos
                              if (messageText === null || !messageText || messageText.trim() === "") return null;

                              return (
                                <div
                                  key={msg.id || idx}
                                  className={`flex ${!isBot ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div className={`flex flex-col ${!isBot ? 'items-start' : 'items-end'} max-w-[75%]`}>
                                    <div className="text-xs text-muted-foreground mb-1 px-2">
                                      {!isBot ? customerData.customer.Cliente : "Bot POINT"}
                                    </div>
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 ${
                                        !isBot
                                          ? 'bg-muted text-foreground rounded-tl-none'
                                          : 'bg-primary text-primary-foreground rounded-tr-none'
                                      }`}                                    >
                                      {messageText.includes('<strong>') ? (
                                        <p 
                                          className="text-sm whitespace-pre-wrap break-words"
                                          dangerouslySetInnerHTML={{ __html: messageText }}
                                        />
                                      ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                          {messageText}
                                        </p>
                                      )}
                                      <div className={`text-[10px] mt-1 ${!isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                                        {timestamp}
                                      </div>
                                    </div>
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
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al cargar el historial de conversación. Por favor intenta nuevamente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {!isLoadingAll && filteredRecords && filteredRecords.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No se encontraron resultados
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Intenta buscar con otra cédula, celular, nombre o ID de compra
                  </p>
                </div>
              </CardContent>            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationHistoryTab;
