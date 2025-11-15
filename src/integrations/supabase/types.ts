export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      KAMINA_Competencia: {
        Row: {
          Articulo: string
          Categoria: string | null
          Cedula: number
          Celular: number
          Cliente: string
          Compromiso: string | null
          Contesto: string | null
          Costo: string
          CuotasVencidas: number
          DiasMora: number
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Resumen: string | null
          SaldoVencido: number | null
          SentimientoPersona: string | null
          "Tiempo De Llamada": number | null
          Transcript: string | null
          "Url Gravacion": string | null
        }
        Insert: {
          Articulo: string
          Categoria?: string | null
          Cedula: number
          Celular: number
          Cliente: string
          Compromiso?: string | null
          Contesto?: string | null
          Costo: string
          CuotasVencidas: number
          DiasMora: number
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          SentimientoPersona?: string | null
          "Tiempo De Llamada"?: number | null
          Transcript?: string | null
          "Url Gravacion"?: string | null
        }
        Update: {
          Articulo?: string
          Categoria?: string | null
          Cedula?: number
          Celular?: number
          Cliente?: string
          Compromiso?: string | null
          Contesto?: string | null
          Costo?: string
          CuotasVencidas?: number
          DiasMora?: number
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          SentimientoPersona?: string | null
          "Tiempo De Llamada"?: number | null
          Transcript?: string | null
          "Url Gravacion"?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      POINT_Competencia: {
        Row: {
          Articulo: string | null
          Cartera: number
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          compromiso_pago_fecha: string | null
          Confianza: number | null
          contact_id: number | null
          Contesto: string | null
          conversation_id: number | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Prioridad: number
          Proridad: string | null
          Razon: string | null
          RestanteSaldoVencido: number | null
          Resumen: string | null
          SaldoPorVencer: number
          SaldoVencido: number | null
          Segmento: string | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number
          "Tiempo De Llamada": string | null
          TipoDePago: string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      POINT_Competencia_JUSTIN: {
        Row: {
          Articulo: string | null
          Cartera: number
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          compromiso_pago_fecha: string | null
          Confianza: number | null
          contact_id: number | null
          Contesto: string | null
          conversation_id: number | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Prioridad: number
          Proridad: string | null
          Razon: string | null
          RestanteSaldoVencido: number | null
          Resumen: string | null
          SaldoPorVencer: number
          SaldoVencido: number | null
          Segmento: string | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number
          "Tiempo De Llamada": string | null
          TipoDePago: string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      POINT_Competencia_Octubre: {
        Row: {
          Articulo: string | null
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          compromiso_pago_fecha: string | null
          Confianza: number | null
          contact_id: number | null
          Contesto: string | null
          conversation_id: number | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Proridad: string | null
          Razon: string | null
          Resumen: string | null
          SaldoVencido: number | null
          Segmento: string | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number
          "Tiempo De Llamada": string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      POINT_Competencia_Septiembre: {
        Row: {
          Articulo: string | null
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          Confianza: number | null
          Contesto: string | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Proridad: string | null
          Razon: string | null
          Resumen: string | null
          SaldoVencido: number | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number | null
          "Tiempo De Llamada": string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          Confianza?: number | null
          Contesto?: string | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number | null
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          Confianza?: number | null
          Contesto?: string | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number | null
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      POINT_Competencia_SUPABASE: {
        Row: {
          Articulo: string | null
          Cartera: number
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          compromiso_pago_fecha: string | null
          Confianza: number | null
          contact_id: number | null
          Contesto: string | null
          conversation_id: number | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Prioridad: number
          Proridad: string | null
          Razon: string | null
          RestanteSaldoVencido: number | null
          Resumen: string | null
          SaldoPorVencer: number
          SaldoVencido: number | null
          Segmento: string | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number
          "Tiempo De Llamada": string | null
          TipoDePago: string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Cartera?: number
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Prioridad?: number
          Proridad?: string | null
          Razon?: string | null
          RestanteSaldoVencido?: number | null
          Resumen?: string | null
          SaldoPorVencer?: number
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          TipoDePago?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      POINT_Competenciaa: {
        Row: {
          Articulo: string | null
          Categoria: string | null
          Cedula: number | null
          Celular: number | null
          Cliente: string | null
          ComprobanteEnviado: string | null
          Compromiso: string | null
          compromiso_pago_fecha: string | null
          Confianza: number | null
          contact_id: number | null
          Contesto: string | null
          conversation_id: number | null
          Costo: string | null
          CuotasVencidas: number | null
          DiasMora: number | null
          DiceQueYaPago: string | null
          Equivocado: string | null
          FechaCompromiso: string | null
          FechaProximaLlamada: string | null
          FechaYHora: string | null
          Genero: string | null
          GestionHumana: string | null
          idCompra: number
          IntentosLLamada: number
          Llamadas: Json | null
          LlamarOtraVez: string | null
          Motivo: string | null
          Pagado: string | null
          Plataforma: string | null
          Proridad: string | null
          Razon: string | null
          Resumen: string | null
          SaldoVencido: number | null
          Segmento: string | null
          SentimientoPersona: string | null
          Status: string
          TandaDelDia: number
          "Tiempo De Llamada": string | null
          Transcript: string | null
          UltimaLlamada: string | null
          "Url Gravacion": string | null
          WhatsappEnviado: string | null
        }
        Insert: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Update: {
          Articulo?: string | null
          Categoria?: string | null
          Cedula?: number | null
          Celular?: number | null
          Cliente?: string | null
          ComprobanteEnviado?: string | null
          Compromiso?: string | null
          compromiso_pago_fecha?: string | null
          Confianza?: number | null
          contact_id?: number | null
          Contesto?: string | null
          conversation_id?: number | null
          Costo?: string | null
          CuotasVencidas?: number | null
          DiasMora?: number | null
          DiceQueYaPago?: string | null
          Equivocado?: string | null
          FechaCompromiso?: string | null
          FechaProximaLlamada?: string | null
          FechaYHora?: string | null
          Genero?: string | null
          GestionHumana?: string | null
          idCompra?: number
          IntentosLLamada?: number
          Llamadas?: Json | null
          LlamarOtraVez?: string | null
          Motivo?: string | null
          Pagado?: string | null
          Plataforma?: string | null
          Proridad?: string | null
          Razon?: string | null
          Resumen?: string | null
          SaldoVencido?: number | null
          Segmento?: string | null
          SentimientoPersona?: string | null
          Status?: string
          TandaDelDia?: number
          "Tiempo De Llamada"?: string | null
          Transcript?: string | null
          UltimaLlamada?: string | null
          "Url Gravacion"?: string | null
          WhatsappEnviado?: string | null
        }
        Relationships: []
      }
      point_compromiso_pago: {
        Row: {
          cedulas: string[]
          count_day: number
          fecha: string | null
          hora: string | null
          id: number
          notes: string | null
          total_cum: number
        }
        Insert: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Update: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Relationships: []
      }
      point_mora_1: {
        Row: {
          cedulas: string[]
          count_day: number
          fecha: string | null
          hora: string | null
          id: number
          notes: string | null
          total_cum: number
        }
        Insert: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Update: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Relationships: []
      }
      point_mora_3: {
        Row: {
          cedulas: string[]
          count_day: number
          fecha: string | null
          hora: string | null
          id: number
          notes: string | null
          total_cum: number
        }
        Insert: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Update: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Relationships: []
      }
      point_mora_5: {
        Row: {
          cedulas: string[]
          count_day: number
          fecha: string | null
          hora: string | null
          id: number
          notes: string | null
          total_cum: number
        }
        Insert: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Update: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Relationships: []
      }
      point_reactivacion_cobro: {
        Row: {
          cedulas: string[]
          count_day: number
          fecha: string | null
          hora: string | null
          id: number
          notes: string | null
          total_cum: number
        }
        Insert: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Update: {
          cedulas?: string[]
          count_day?: number
          fecha?: string | null
          hora?: string | null
          id?: number
          notes?: string | null
          total_cum?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_llamadas: {
        Args: {
          _fecha_compromiso?: string
          _idcompra: number
          _intentos?: number
          _nuevas: Json
          _ultima?: string
        }
        Returns: Json
      }
      append_llamadas_only: {
        Args: { _idcompra: number; _nuevas: Json }
        Returns: Json
      }
      assign_default_admin: { Args: never; Returns: undefined }
      exec_sql: { Args: { sql_query: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authorized_user: { Args: { _user_id: string }; Returns: boolean }
      log_data_access: {
        Args: {
          p_action: string
          p_record_count?: number
          p_table_name: string
        }
        Returns: undefined
      }
      mark_pagados: { Args: { api_ids: number[] }; Returns: undefined }
      upsert_point_rows: { Args: { payload: Json }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "agent" | "supervisor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agent", "supervisor", "viewer"],
    },
  },
} as const
