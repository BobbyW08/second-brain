export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "14.5";
	};
	public: {
		Tables: {
			ai_usage: {
				Row: {
					created_at: string;
					feature: string;
					id: string;
					tokens_used: number | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					feature: string;
					id?: string;
					tokens_used?: number | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					feature?: string;
					id?: string;
					tokens_used?: number | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "ai_usage_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			buckets: {
				Row: {
					color: string | null;
					created_at: string;
					id: string;
					name: string;
					position: number | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string;
					id?: string;
					name: string;
					position?: number | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					color?: string | null;
					created_at?: string;
					id?: string;
					name?: string;
					position?: number | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "buckets_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			calendar_blocks: {
				Row: {
					block_type: string | null;
					color: string | null;
					created_at: string;
					end_time: string;
					google_event_id: string | null;
					id: string;
					is_synced: boolean | null;
					linked_page_id: string | null;
					start_time: string;
					task_id: string | null;
					title: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					block_type?: string | null;
					color?: string | null;
					created_at?: string;
					end_time: string;
					google_event_id?: string | null;
					id?: string;
					is_synced?: boolean | null;
					linked_page_id?: string | null;
					start_time: string;
					task_id?: string | null;
					title: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					block_type?: string | null;
					color?: string | null;
					created_at?: string;
					end_time?: string;
					google_event_id?: string | null;
					id?: string;
					is_synced?: boolean | null;
					linked_page_id?: string | null;
					start_time?: string;
					task_id?: string | null;
					title?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "calendar_blocks_linked_page_id_fkey";
						columns: ["linked_page_id"];
						isOneToOne: false;
						referencedRelation: "pages";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "calendar_blocks_task_id_fkey";
						columns: ["task_id"];
						isOneToOne: false;
						referencedRelation: "tasks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "calendar_blocks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			folders: {
				Row: {
					created_at: string;
					icon: string | null;
					id: string;
					is_system: boolean;
					name: string;
					parent_id: string | null;
					position: number | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					icon?: string | null;
					id?: string;
					is_system?: boolean;
					name: string;
					parent_id?: string | null;
					position?: number | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					icon?: string | null;
					id?: string;
					is_system?: boolean;
					name?: string;
					parent_id?: string | null;
					position?: number | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "folders_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "folders";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "folders_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			invites: {
				Row: {
					created_at: string;
					email: string;
					expires_at: string;
					id: string;
					invited_by: string | null;
					token: string;
					used: boolean;
				};
				Insert: {
					created_at?: string;
					email: string;
					expires_at?: string;
					id?: string;
					invited_by?: string | null;
					token: string;
					used?: boolean;
				};
				Update: {
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: string;
					invited_by?: string | null;
					token?: string;
					used?: boolean;
				};
				Relationships: [
					{
						foreignKeyName: "invites_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			links: {
				Row: {
					created_at: string;
					id: string;
					source_id: string;
					source_type: string;
					target_id: string;
					target_type: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					source_id: string;
					source_type: string;
					target_id: string;
					target_type: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					source_id?: string;
					source_type?: string;
					target_id?: string;
					target_type?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "links_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			pages: {
				Row: {
					content: Json | null;
					created_at: string;
					folder_id: string | null;
					id: string;
					is_pinned: boolean | null;
					journal_date: string | null;
					page_type: string | null;
					position: number | null;
					title: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					content?: Json | null;
					created_at?: string;
					folder_id?: string | null;
					id?: string;
					is_pinned?: boolean | null;
					journal_date?: string | null;
					page_type?: string | null;
					position?: number | null;
					title?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					content?: Json | null;
					created_at?: string;
					folder_id?: string | null;
					id?: string;
					is_pinned?: boolean | null;
					journal_date?: string | null;
					page_type?: string | null;
					position?: number | null;
					title?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "pages_folder_id_fkey";
						columns: ["folder_id"];
						isOneToOne: false;
						referencedRelation: "folders";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "pages_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			profiles: {
				Row: {
					ai_usage_count: number | null;
					avatar_url: string | null;
					created_at: string;
					display_name: string;
					email: string | null;
					google_access_token: string | null;
					google_calendar_id: string | null;
					google_refresh_token: string | null;
					google_token_expiry: string | null;
					id: string;
					is_admin: boolean;
					tone_preference: string | null;
					updated_at: string;
				};
				Insert: {
					ai_usage_count?: number | null;
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string;
					email?: string | null;
					google_access_token?: string | null;
					google_calendar_id?: string | null;
					google_refresh_token?: string | null;
					google_token_expiry?: string | null;
					id?: string;
					is_admin?: boolean;
					tone_preference?: string | null;
					updated_at?: string;
				};
				Update: {
					ai_usage_count?: number | null;
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string;
					email?: string | null;
					google_access_token?: string | null;
					google_calendar_id?: string | null;
					google_refresh_token?: string | null;
					google_token_expiry?: string | null;
					id?: string;
					is_admin?: boolean;
					tone_preference?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			tasks: {
				Row: {
					attendees: Json | null;
					block_size: string;
					bucket_id: string | null;
					color: string | null;
					completed_at: string | null;
					created_at: string;
					description: string | null;
					end_time: string | null;
					id: string;
					labels: string[] | null;
					location: string | null;
					notes: Json | null;
					position: number | null;
					priority: string;
					recurring: string | null;
					start_time: string | null;
					status: string;
					title: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					attendees?: Json | null;
					block_size?: string;
					bucket_id?: string | null;
					color?: string | null;
					completed_at?: string | null;
					created_at?: string;
					description?: string | null;
					end_time?: string | null;
					id?: string;
					labels?: string[] | null;
					location?: string | null;
					notes?: Json | null;
					position?: number | null;
					priority: string;
					recurring?: string | null;
					start_time?: string | null;
					status?: string;
					title: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					attendees?: Json | null;
					block_size?: string;
					bucket_id?: string | null;
					color?: string | null;
					completed_at?: string | null;
					created_at?: string;
					description?: string | null;
					end_time?: string | null;
					id?: string;
					labels?: string[] | null;
					location?: string | null;
					notes?: Json | null;
					position?: number | null;
					priority?: string;
					recurring?: string | null;
					start_time?: string | null;
					status?: string;
					title?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "tasks_bucket_id_fkey";
						columns: ["bucket_id"];
						isOneToOne: false;
						referencedRelation: "buckets";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tasks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
