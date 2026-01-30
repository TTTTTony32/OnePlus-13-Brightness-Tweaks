#!/system/bin/sh

MODPATH="${0%/*}"
# 系统基础路径
BASE_DIR="/my_product/vendor/etc"

# ==========================================
# 挂载函数 (定义在最前方便调用)
# ==========================================
mount_file() {
    local mod_file="$1"
    local target_file="$2"
    
    if [ -s "$mod_file" ] && [ -f "$target_file" ]; then
        mount -o bind "$mod_file" "$target_file"
        chmod 0644 "$mod_file"
        chcon u:object_r:system_file:s0 "$mod_file" 2>/dev/null
    fi
}

# ==========================================
# Feature Config (清空 HdrGeneric)
# ==========================================
FILE_FEATURE="multimedia_display_feature_config.xml"
TARGET_FEATURE="$BASE_DIR/$FILE_FEATURE"
MOD_FEATURE="$MODPATH/$FILE_FEATURE"

if [ -f "$TARGET_FEATURE" ]; then
    awk '
      /<feature name="HdrGeneric"/ { in_block = 1 }
      in_block && /<\/feature>/ { in_block = 0 }
      in_block && /<supportApp>/ { next }
      { print }
    ' "$TARGET_FEATURE" > "$MOD_FEATURE"
    mount_file "$MOD_FEATURE" "$TARGET_FEATURE"
fi

# ==========================================
# Brightness Config (P系列多机型适配)
# ==========================================
# 逻辑：遍历所有符合 display_brightness_config_P_?.xml 的文件
# 动作：无论原值如何，强制 max -> 4674, min -> 1

# 使用 find 或者直接 shell 通配符遍历
for target_file in "$BASE_DIR"/display_brightness_config_P_?.xml; do
    # 检查文件是否存在（避免通配符未匹配时出错）
    if [ -f "$target_file" ]; then
        filename=$(basename "$target_file")
        mod_file="$MODPATH/$filename"
        
        # 复制原文件
        cp "$target_file" "$mod_file"
        
        # 正则替换：匹配 max="..." 和 min="..." 中的任意内容并替换
        # 使用 -E 启用扩展正则，[^"]* 代表匹配双引号内的任意字符
        sed -i -E 's/max="[^"]*"/max="4674"/g' "$mod_file"
        sed -i -E 's/min="[^"]*"/min="1"/g' "$mod_file"
        
        # 挂载
        mount_file "$mod_file" "$target_file"
    fi
done

# ==========================================
# Brightness App List
# ==========================================
FILE_APP_LIST="display_brightness_app_list.xml"
TARGET_APP_LIST="$BASE_DIR/$FILE_APP_LIST"
MOD_APP_LIST="$MODPATH/$FILE_APP_LIST"

if [ -f "$TARGET_APP_LIST" ]; then
    awk '
        # 修改全局亮度限制 1200 -> 1600
        /<global_brightness_limit/ {
            sub(/nit="[^"]*"/, "nit=\"1600\"")
        }
        { print }
    ' "$TARGET_APP_LIST" > "$MOD_APP_LIST"
    mount_file "$MOD_APP_LIST" "$TARGET_APP_LIST"
fi

exit 0