"use client";
import useAuth from "@/services/auth/use-auth";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(20),
  height: theme.spacing(20),
}));

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation("profile");
  return (
    <Container maxWidth="sm">
      <Grid container spacing={3} wrap="nowrap" pt={3}>
        <Grid size="auto">
          <StyledAvatar
            alt={user?.first_name + " " + user?.last_name}
            data-testid="user-icon"
            src={user?.profile_image_url}
          />
        </Grid>
        <Grid size="grow">
          <Typography variant="h3" gutterBottom data-testid="user-name">
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="h5" gutterBottom data-testid="user-email">
            {user?.email}
          </Typography>
          <Grid container>
            <Grid>
              <Button
                variant="contained"
                color="primary"
                LinkComponent={Link}
                href="/profile/edit"
                data-testid="edit-profile"
              >
                {t("profile:actions.edit")}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default withPageRequiredAuth(Profile);
