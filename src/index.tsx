import { Form, ActionPanel, Action, Clipboard, showToast, Toast, LaunchProps } from "@raycast/api";
import { useState } from "react";
import fetch, { Headers, RequestInit } from "node-fetch";

type Values = {
  lifetime: string;
  recipient: string;
  passphrase: string;
  secret: string;
};

type OneTimeSecretResponse = {
  custid: string;
  metadata_key: string;
  secret_key: string;
  ttl: number;
  metadata_ttl: number;
  secret_ttl: number;
  state: string;
  updated: number;
  created: number;
  recipient: Array<string>;
  passphrase_required: string;
};

export default function Command(props: LaunchProps<{ draftValues: Values }>) {
  const { draftValues } = props;

  const [secretError, setSecretError] = useState<string | undefined>();

  function dropSecretErrorIfNeeded() {
    if (secretError && secretError.length > 0) {
      setSecretError(undefined);
    }
  }

  async function handleSubmit(values: Values) {
    console.log(values);

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Storing secret",
    });

    try {
      const baseUrl = "https://onetimesecret.com";

      const url = new URL(`${baseUrl}/api/v1/share`);

      const body = new URLSearchParams();
      body.append("secret", values.secret);
      body.append("ttl", values.lifetime);

      if (values.passphrase) {
        body.append("passphrase", values.passphrase);
      }

      const init: RequestInit = {
        method: "POST",
        headers: new Headers([["content-type", "application/x-www-form-urlencoded"]]),
        body: body.toString(),
      };

      const response = await fetch(url.href, init);
      const data: OneTimeSecretResponse = (await response.json()) as OneTimeSecretResponse;
      console.log(data);

      const shareableUrl = `${baseUrl}/secret/${data?.secret_key}`;

      await Clipboard.copy(shareableUrl);

      toast.style = Toast.Style.Success;
      toast.title = "Shared secret";
      toast.message = "Copied link to clipboard";
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed sharing secret";
      toast.message = String(error);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
      enableDrafts
    >
      <Form.TextArea
        id="secret"
        title="Secret*"
        placeholder="The secret to be sent"
        info="Required"
        defaultValue={draftValues?.secret}
        error={secretError}
        onChange={dropSecretErrorIfNeeded}
        onBlur={(event) => {
          const value = event.target.value;

          if (value?.length === 0) {
            setSecretError("You must provide a secret");
          }
        }}
      />
      <Form.Separator />
      <Form.TextField
        id="passphrase"
        title="Passphrase"
        placeholder="Something top sneaky"
        info="Optional. Encrypt the secret with this value."
        defaultValue={draftValues?.passphrase}
      />
      <Form.Dropdown
        id="lifetime"
        title="Lifetime*"
        info="Required. How long should the secret be available for?"
        storeValue
      >
        <Form.Dropdown.Item value="300" title="5 minutes" />
        <Form.Dropdown.Item value="1800" title="30 minutes" />
        <Form.Dropdown.Item value="3600" title="1 hour" />
        <Form.Dropdown.Item value="14400" title="4 hours" />
        <Form.Dropdown.Item value="43200" title="12 hours" />
        <Form.Dropdown.Item value="86400" title="1 day" />
        <Form.Dropdown.Item value="259200" title="3 days" />
        <Form.Dropdown.Item value="604800" title="7 days" />
        <Form.Dropdown.Item value="1209600" title="14 days" />
      </Form.Dropdown>
    </Form>
  );
}
