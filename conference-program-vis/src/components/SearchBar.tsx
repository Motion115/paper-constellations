import { Flex, Select, Typography } from "antd";
import { ContentLookupSpec } from "../types";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface SearchBarProps {
  data: ContentLookupSpec;
  searchId: string;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
}

interface SelectOption {
  value: string;
  label: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  data,
  searchId,
  setSearchId,
}) => {
  const searchList: SelectOption[] = Object.entries(data).map(
    ([id, content]) => ({
      value: id,
      label: content.title,
    })
  );
  const [defaultValue, setDefaultValue] = useState<string>(
    ""
  );
  useEffect(() => {
    if (searchId !== "") {
      setDefaultValue(data[searchId].title);
    }
    else {
      setDefaultValue("");
    }
  }, [searchId])


  const onChange = (value: string) => {
    setSearchId(value);
    // console.log(`selected ${value}`);
  };

  // const onSearch = (value: string) => {
  //   console.log("search:", value);
  // };

  return (
    <Flex wrap gap="large">
      <Text style={{ fontWeight: "bold" }}>Star paper: </Text>
      <Select
        showSearch
        placeholder="Search content"
        optionFilterProp="label"
        onChange={onChange}
        // onSearch={onSearch}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        style={{ height: "2rem", flex: "1" }}
        options={searchList}
        value={defaultValue}
      />
    </Flex>
  );
};

export default SearchBar;
