-- Function to atomically update player progress in the JSONB array
-- Run this in your Supabase SQL Editor

create or replace function update_player_progress(
  p_game_pin text,
  p_player_id text,
  p_quiz_score int,
  p_questions_answered int,
  p_memory_progress jsonb default null
)
returns boolean
language plpgsql
as $$
declare
  v_participants jsonb;
  v_player_index int;
  v_player jsonb;
begin
  -- Lock the row for update to prevent concurrent writes
  select participants into v_participants
  from game_sessions
  where game_pin = p_game_pin
  for update;

  if not found then
    return false;
  end if;

  -- Find player index in the participants array
  select pos - 1 into v_player_index
  from jsonb_array_elements(v_participants) with ordinality arr(elem, pos)
  where elem->>'id' = p_player_id;

  if v_player_index is null then
    return false;
  end if;

  -- Get current player object
  v_player := v_participants->v_player_index;

  -- Update fields if provided (and greater than current to ensure monotonicity)
  if p_quiz_score is not null then
    v_player := jsonb_set(v_player, '{quiz_score}', to_jsonb(greatest(coalesce((v_player->>'quiz_score')::int, 0), p_quiz_score)));
  end if;

  if p_questions_answered is not null then
    v_player := jsonb_set(v_player, '{questions_answered}', to_jsonb(greatest(coalesce((v_player->>'questions_answered')::int, 0), p_questions_answered)));
  end if;
  
  if p_memory_progress is not null then
    v_player := jsonb_set(v_player, '{memory_progress}', p_memory_progress);
  end if;

  -- Update last_active timestamp
  v_player := jsonb_set(v_player, '{last_active}', to_jsonb(now()));

  -- Update the player in the participants array
  v_participants := jsonb_set(v_participants, ('{' || v_player_index || '}')::text[], v_player);

  -- Update the game_sessions table
  update game_sessions
  set participants = v_participants
  where game_pin = p_game_pin;

  return true;
end;
$$;
