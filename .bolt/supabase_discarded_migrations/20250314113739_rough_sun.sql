/*
  # Add stage field to issues

  1. Changes
    - Add `stage` column to issues table to link with work order stages
    - Add check constraint to ensure valid stages
    - Add index for performance

  2. Notes
    - Stage can be null (issue might affect multiple stages or be general)
    - Includes all possible stages from both INCO and ANTI processes
*/

-- Add stage column
ALTER TABLE issues
ADD COLUMN stage text;

-- Add check constraint for valid stages
ALTER TABLE issues
ADD CONSTRAINT issues_stage_check
CHECK (
  stage IS NULL OR
  stage = ANY (ARRAY[
    'Preparacion',
    'Cuerpo',
    'Paquet/Skid',
    'E.N.D.',
    'P.H.',
    'Anticorr',
    'Liberacion Pintura',
    'FAT',
    'Despacho'
  ])
);

-- Add index for performance
CREATE INDEX issues_stage_idx ON issues(stage);