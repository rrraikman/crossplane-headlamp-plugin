import { BackLink } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box } from '@mui/material';

export function LoadError({ what, error }: { what: string; error?: { message?: string } | null }) {
  return (
    <>
      <BackLink />
      <Box p={2}>
        <Alert severity="error">
          Failed to load <strong>{what}</strong>
          {error?.message && `: ${error.message}`}
        </Alert>
      </Box>
    </>
  );
}
