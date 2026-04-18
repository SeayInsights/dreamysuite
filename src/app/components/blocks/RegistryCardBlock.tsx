import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { CardEffectWrapper } from "@/app/components/CardEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function RegistryCardBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const name = String(cfg.name ?? cfg.title ?? "Registry");
  const url = String(cfg.url ?? "");
  const imageUrl = cfg.imageUrl as string | undefined;

  return (
    <section className="block block-registry-card" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <CardEffectWrapper>
        <div style={{ textAlign: "center", padding: "1.5rem" }}>
          {imageUrl && <img src={imageUrl} alt={name} style={{ maxWidth: "120px", borderRadius: "8px", marginBottom: "0.75rem" }} />}
          <TextEffectWrapper as="h3" style={{ margin: "0 0 0.5rem" }}>{name}</TextEffectWrapper>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #B8921A)" }}>View Registry</a>}
        </div>
      </CardEffectWrapper>
    </section>
  );
}
