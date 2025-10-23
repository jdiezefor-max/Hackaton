export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          event_id: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_id: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_id?: string;
          color?: string;
          created_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string;
          type: 'text' | 'image' | 'video';
          points: number;
          order: number;
          location_lat: number | null;
          location_lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string;
          type: 'text' | 'image' | 'video';
          points?: number;
          order?: number;
          location_lat?: number | null;
          location_lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string;
          type?: 'text' | 'image' | 'video';
          points?: number;
          order?: number;
          location_lat?: number | null;
          location_lng?: number | null;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          challenge_id: string;
          team_id: string;
          user_name: string;
          content: string;
          type: 'text' | 'image' | 'video';
          votes_count: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          team_id: string;
          user_name: string;
          content: string;
          type: 'text' | 'image' | 'video';
          votes_count?: number;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          team_id?: string;
          user_name?: string;
          content?: string;
          type?: 'text' | 'image' | 'video';
          votes_count?: number;
          submitted_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          response_id: string;
          voter_name: string;
          voter_team_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          voter_name: string;
          voter_team_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          voter_name?: string;
          voter_team_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
