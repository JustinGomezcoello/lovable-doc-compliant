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
import LoadingState from "@/components/ui/loading-state";

const AnalysisTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);  // Query para obtener todos los clientes con conversaciones
  const { data: allCustomers, isLoading: isLoadingAll } = useQuery({
    queryKey: ["all-customers-with-conversations-v3"], // Cambiar key para forzar refetch
    queryFn: async () => {
      console.log("🔍 Cargando TODOS los clientes con conversaciones...");
      
      // Obtener TODOS los registros usando paginación manual
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMoreData = true;
      
      while (hasMoreData) {
        console.log(`📖 Obteniendo página ${page + 1}...`);
        
        const { data, error } = await supabase
          .from("POINT_Competencia")
          .select("idCompra, Cliente, Cedula, Celular, conversation_id, ComprobanteEnviado, Articulo")
          .not("conversation_id", "is", null)
          .neq("conversation_id", 0)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order("Cliente", { ascending: true });

        if (error) {
          console.error("❌ Error loading customers:", error);
          break;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          console.log(`✅ Página ${page + 1}: ${data.length} clientes obtenidos`);
          console.log(`📈 Total acumulado: ${allData.length} clientes`);
          
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

      console.log(`🎯 TOTAL FINAL de clientes: ${allData.length}`);
      console.log(`✅ Esperados: 1155 clientes con conversation_id válido`);

      return allData || [];
    }
  });

  // Query para obtener el detalle del cliente seleccionado y su conversación
  const { data: customerData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["customer-detail", selectedCustomer?.idCompra],
    queryFn: async () => {
      if (!selectedCustomer) return null;

      console.log("🔍 Loading detail for customer:", selectedCustomer.idCompra);

      // Get full customer data
      const { data: customerDetail, error: customerError } = await supabase
        .from("POINT_Competencia")
        .select("*")
        .eq("idCompra", selectedCustomer.idCompra)
        .maybeSingle();

      if (customerError) {
        console.error("❌ Error loading customer detail:", customerError);
        return null;
      }

      if (!customerDetail) {
        console.log("⚠️ No customer detail found");
        return null;
      }

      console.log("✅ Customer detail found:", {
        idCompra: customerDetail.idCompra,
        Cliente: customerDetail.Cliente,
        conversation_id: customerDetail.conversation_id
      });

      // Get conversation history if conversation_id exists
      let conversations = null;
      if (customerDetail.conversation_id && customerDetail.conversation_id > 0) {
        console.log("🔍 Fetching chat history for session_id:", customerDetail.conversation_id);
        
        const { data: chatData, error: chatError } = await supabase
          .from("n8n_chat_histories")
          .select("*")
          .eq("session_id", customerDetail.conversation_id.toString())
          .order("created_at", { ascending: true });
        
        if (chatError) {
          console.error("❌ Error fetching chat history:", chatError);
        } else {
          console.log("✅ Chat messages found:", chatData?.length || 0);
          conversations = chatData;
        }
      } else {
        console.log("⚠️ No conversation_id found or is 0");
      }

      return { customer: customerDetail, conversations };
    },
    enabled: !!selectedCustomer
  });

  // Filtrar clientes basado en el término de búsqueda
  const filteredCustomers = allCustomers?.filter(customer => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      customer.Cliente?.toLowerCase().includes(search) ||
      customer.Cedula?.toString().includes(search) ||
      customer.Celular?.toString().includes(search) ||
      customer.idCompra?.toString().includes(search)
    );
  });

  const parseMessage = (msg: any) => {
    try {
      if (msg.type === "human") {
        return msg.content;
      } else if (msg.type === "ai") {
        let output = "";
        
        if (typeof msg.content === 'string') {
          try {
            const parsed = JSON.parse(msg.content);
            output = parsed.output || "";
          } catch {
            output = msg.content;
          }
        } else if (typeof msg.content === 'object' && msg.content.output) {
          output = msg.content.output;
        } else {
          output = msg.content;
        }
        
        if (!output || output.trim() === "") {
          return "plantilla personalizada whatsapp";
        }
        
        return output;
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
        <p className="text-muted-foreground">Busca por cédula, celular, nombre o ID de compra para ver el historial de conversaciones del cliente</p>
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
              placeholder="Busca por nombre, cédula, celular o ID de compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>      </Card>

      {isLoadingAll ? (
        <LoadingState 
          title="Cargando clientes..."
          message="Buscando todos los clientes con conversaciones activas en el sistema."
          skeletonCount={4}
        />
      ) : (
        <>
          {/* Lista de clientes */}
          {filteredCustomers && filteredCustomers.length > 0 && !selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle>Clientes con Conversaciones ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.idCompra}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-semibold">{customer.Cliente}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Cédula: {customer.Cedula}</p>
                              <p>Celular: {customer.Celular}</p>
                              <p>ID Compra: {customer.idCompra}</p>
                            </div>
                          </div>
                          {customer.ComprobanteEnviado === "SI" && (
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
          {selectedCustomer && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCustomer(null)}
                className="mb-4"
              >
                ← Volver a la lista
              </Button>              {isLoadingDetail ? (
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
                          <div className="space-y-3 py-2">
                            {customerData.conversations.map((msg: any, idx: number) => {
                              const messageText = parseMessage(msg.message);
                              const isHuman = msg.message.type === "human";
                              const timestamp = new Date(msg.created_at).toLocaleString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              });

                              if (!messageText || messageText.trim() === "") return null;

                              return (
                                <div
                                  key={msg.id || idx}
                                  className={`flex ${isHuman ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div className={`flex flex-col ${isHuman ? 'items-start' : 'items-end'} max-w-[75%]`}>
                                    <div className="text-xs text-muted-foreground mb-1 px-2">
                                      {isHuman ? customerData.customer.Cliente : "Bot POINT"}
                                    </div>
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 ${
                                        isHuman
                                          ? 'bg-muted text-foreground rounded-tl-none'
                                          : 'bg-primary text-primary-foreground rounded-tr-none'
                                      }`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap break-words">
                                        {messageText}
                                      </p>
                                      <div className={`text-[10px] mt-1 ${isHuman ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
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
              ) : null}
            </div>
          )}

          {!isLoadingAll && filteredCustomers && filteredCustomers.length === 0 && (
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AnalysisTab;
