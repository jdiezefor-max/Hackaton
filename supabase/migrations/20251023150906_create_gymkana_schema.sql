/*
  # Schema para Sistema de Gymkana con Votaciones

  ## Descripción
  Sistema completo para gestionar gymkanas en bodas y eventos con:
  - Equipos participantes
  - Pruebas/desafíos
  - Respuestas de usuarios (texto, imágenes, vídeos)
  - Sistema de votaciones para contenido multimedia
  - Ranking por puntuaciones

  ## Tablas Nuevas

  ### `teams` (Equipos)
  - `id` (uuid, PK) - Identificador único del equipo
  - `name` (text) - Nombre del equipo
  - `event_id` (uuid) - ID del evento/gymkana
  - `color` (text) - Color representativo del equipo
  - `created_at` (timestamptz) - Fecha de creación

  ### `challenges` (Pruebas/Desafíos)
  - `id` (uuid, PK) - Identificador único de la prueba
  - `event_id` (uuid) - ID del evento/gymkana
  - `title` (text) - Título de la prueba
  - `description` (text) - Descripción detallada
  - `type` (text) - Tipo: 'text', 'image', 'video'
  - `points` (integer) - Puntos base de la prueba
  - `order` (integer) - Orden de la prueba en el mapa
  - `location_lat` (float) - Latitud de ubicación
  - `location_lng` (float) - Longitud de ubicación
  - `created_at` (timestamptz) - Fecha de creación

  ### `responses` (Respuestas)
  - `id` (uuid, PK) - Identificador único de la respuesta
  - `challenge_id` (uuid, FK) - Referencia a la prueba
  - `team_id` (uuid, FK) - Referencia al equipo
  - `user_name` (text) - Nombre del usuario que respondió
  - `content` (text) - Contenido de la respuesta (texto o URL)
  - `type` (text) - Tipo: 'text', 'image', 'video'
  - `votes_count` (integer) - Contador de votos recibidos
  - `submitted_at` (timestamptz) - Fecha de envío

  ### `votes` (Votaciones)
  - `id` (uuid, PK) - Identificador único del voto
  - `response_id` (uuid, FK) - Referencia a la respuesta votada
  - `voter_name` (text) - Nombre del votante
  - `voter_team_id` (uuid, FK) - Equipo del votante (opcional)
  - `created_at` (timestamptz) - Fecha del voto

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas permiten lectura pública para visualización tipo Kahoot
  - Políticas restrictivas para escritura (solo usuarios autenticados)
*/

-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_id uuid NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de pruebas/desafíos
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL CHECK (type IN ('text', 'image', 'video')),
  points integer DEFAULT 10,
  "order" integer DEFAULT 0,
  location_lat float,
  location_lng float,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de respuestas
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'image', 'video')),
  votes_count integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Crear tabla de votaciones
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  voter_name text NOT NULL,
  voter_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(response_id, voter_name)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_responses_challenge ON responses(challenge_id);
CREATE INDEX IF NOT EXISTS idx_responses_team ON responses(team_id);
CREATE INDEX IF NOT EXISTS idx_votes_response ON votes(response_id);
CREATE INDEX IF NOT EXISTS idx_challenges_event ON challenges(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_event ON teams(event_id);

-- Habilitar RLS en todas las tablas
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas para teams (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para challenges (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para responses (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view responses"
  ON responses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create responses"
  ON responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update responses"
  ON responses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para votes (lectura pública, escritura autenticada)
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Función para actualizar contador de votos
CREATE OR REPLACE FUNCTION update_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE responses 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.response_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE responses 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.response_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el contador de votos
CREATE TRIGGER trigger_update_votes_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_votes_count();