import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { AnyRecord, asRecord, getString } from "@/utils/data";
import { getTreeChildren, normalizeTreeNode } from "@/features/referrals/referrals.utils";

type ReferralTreeViewProps = {
  tree: unknown;
};

export function ReferralTreeView({ tree }: ReferralTreeViewProps) {
  const root = normalizeTreeNode(tree);

  if (Object.keys(root).length === 0) {
    return null;
  }

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Arvore</Text>
        <TreeNode node={root} level={0} />
      </View>
    </Card>
  );
}

function TreeNode({ node, level }: { node: AnyRecord; level: number }) {
  const children = getTreeChildren(node).map(asRecord);
  const name = getString(node, ["name", "fullName", "email", "referralCode"], "Usuario");

  return (
    <View className="gap-2" style={{ paddingLeft: level * 14 }}>
      <Text className="text-sm font-semibold text-uau-black">
        {level > 0 ? "→ " : ""}
        {name}
      </Text>
      {children.map((child, index) => (
        <TreeNode key={getString(child, ["id"], `${level}-${index}`)} level={level + 1} node={child} />
      ))}
    </View>
  );
}
